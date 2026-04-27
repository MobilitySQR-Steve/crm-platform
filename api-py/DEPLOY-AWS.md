# Deployment Guide — AWS

Reference deployment for the Django API + morning cron on AWS.

The recommended shape:

| Component | Service | Why |
|---|---|---|
| Web API | ECS Fargate (or Elastic Beanstalk) | Stateless container; scales horizontally; no server management |
| Cron job | EventBridge → ECS RunTask | Scheduled task definition that runs the `morning_cron` management command |
| Database | RDS Postgres 16 | Managed Postgres; encrypted at rest; multi-AZ for prod |
| Secrets | Secrets Manager | `DJANGO_SECRET_KEY`, `DATABASE_URL`, `ANTHROPIC_API_KEY` injected as env vars |
| Container registry | ECR | Same VPC; private; lifecycle policies for old tags |
| Load balancer | Application Load Balancer | TLS termination; health checks at `/health` |
| Static files | CloudFront + S3 (optional) | Django Admin CSS/JS — `python manage.py collectstatic` already runs in the Dockerfile |
| Frontend | CloudFront + S3 (separate Vercel deploy also fine) | The React SPA is built separately and points at the ALB URL via `VITE_API_URL` |

If your team prefers Elastic Beanstalk over Fargate, the Dockerfile works there too — Beanstalk has a Docker platform; just push the image and configure env vars + a worker tier (or scheduled tasks via cron.yaml) for the morning job.

---

## 1. Build + push the image

```bash
# From api-py/, after configuring AWS credentials
aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com

docker build -t crm-api -f Dockerfile .
docker tag crm-api:latest <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/crm-api:latest
docker push <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/crm-api:latest
```

ECR repo creation is one-time:
```bash
aws ecr create-repository --repository-name crm-api --region us-east-1
```

---

## 2. RDS Postgres

```bash
aws rds create-db-instance \
  --db-instance-identifier crm-prod \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 16 \
  --allocated-storage 20 \
  --master-username crm \
  --master-user-password '<paste-strong-password>' \
  --vpc-security-group-ids sg-xxxxxxxx \
  --backup-retention-period 7 \
  --storage-encrypted
```

After it's available, get the endpoint:
```bash
aws rds describe-db-instances --db-instance-identifier crm-prod \
  --query 'DBInstances[0].Endpoint.Address' --output text
```

The `DATABASE_URL` for the app:
```
postgres://crm:<password>@<endpoint>:5432/crm
```

(Create the `crm` database manually first time: `createdb -h <endpoint> -U crm crm`.)

---

## 3. Secrets Manager

Store the three secrets so they're never baked into the image or task definition:

```bash
aws secretsmanager create-secret --name crm/django-secret-key \
  --secret-string "$(openssl rand -hex 32)"

aws secretsmanager create-secret --name crm/database-url \
  --secret-string "postgres://crm:<password>@<endpoint>:5432/crm"

aws secretsmanager create-secret --name crm/anthropic-api-key \
  --secret-string "sk-ant-api03-..."
```

ECS task definition references them via `secrets:` (see step 4).

---

## 4. ECS task definition (web)

`task-def-web.json`:

```json
{
  "family": "crm-api-web",
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<ACCOUNT>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "web",
      "image": "<ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/crm-api:latest",
      "portMappings": [{"containerPort": 8000, "protocol": "tcp"}],
      "essential": true,
      "environment": [
        {"name": "DJANGO_DEBUG", "value": "false"},
        {"name": "DJANGO_ALLOWED_HOSTS", "value": "<alb-dns-name>,api.example.com"},
        {"name": "CORS_ALLOWED_ORIGINS", "value": "https://app.example.com"},
        {"name": "ENRICHMENT_MODEL", "value": "claude-sonnet-4-6"}
      ],
      "secrets": [
        {"name": "DJANGO_SECRET_KEY", "valueFrom": "arn:aws:secretsmanager:us-east-1:<ACCOUNT>:secret:crm/django-secret-key"},
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:us-east-1:<ACCOUNT>:secret:crm/database-url"},
        {"name": "ANTHROPIC_API_KEY", "valueFrom": "arn:aws:secretsmanager:us-east-1:<ACCOUNT>:secret:crm/anthropic-api-key"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/crm-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "web"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

Register + run as a service behind an ALB target group:
```bash
aws ecs register-task-definition --cli-input-json file://task-def-web.json
aws ecs create-service --cluster crm --service-name crm-api \
  --task-definition crm-api-web --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-aaa,subnet-bbb],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=web,containerPort=8000"
```

---

## 5. Initial database setup (one-time)

After the service is running, exec into a task to apply migrations + create the first user:

```bash
aws ecs execute-command --cluster crm --task <TASK_ID> --container web \
  --interactive --command "/bin/bash"

# Inside the container:
python manage.py migrate
python manage.py createsuperuser \
  --email steve@mobilitysqr.com --first_name Steve --last_name W.
```

Migrations are idempotent — also safe to run via a one-off ECS RunTask
on every deploy if you want it automated:

```bash
aws ecs run-task --cluster crm --task-definition crm-api-web \
  --overrides '{"containerOverrides":[{"name":"web","command":["python","manage.py","migrate","--noinput"]}]}' \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-aaa],securityGroups=[sg-xxx],assignPublicIp=DISABLED}"
```

---

## 6. Cron — EventBridge → ECS RunTask

Same image, different command. Create a separate task definition that
overrides the entrypoint:

`task-def-cron.json`: (identical to web except no port mapping; same env vars)

EventBridge rule (daily at 07:00 UTC):
```bash
aws events put-rule --name crm-morning-cron \
  --schedule-expression "cron(0 7 * * ? *)"

aws events put-targets --rule crm-morning-cron --targets "[{
  \"Id\": \"1\",
  \"Arn\": \"arn:aws:ecs:us-east-1:<ACCOUNT>:cluster/crm\",
  \"RoleArn\": \"arn:aws:iam::<ACCOUNT>:role/EventBridgeECSRole\",
  \"EcsParameters\": {
    \"TaskDefinitionArn\": \"arn:aws:ecs:us-east-1:<ACCOUNT>:task-definition/crm-api-cron\",
    \"LaunchType\": \"FARGATE\",
    \"NetworkConfiguration\": {
      \"awsvpcConfiguration\": {
        \"Subnets\": [\"subnet-aaa\"],
        \"SecurityGroups\": [\"sg-xxx\"],
        \"AssignPublicIp\": \"DISABLED\"
      }
    },
    \"TaskCount\": 1,
    \"Overrides\": {
      \"ContainerOverrides\": [{
        \"Name\": \"web\",
        \"Command\": [\"python\", \"manage.py\", \"morning_cron\"]
      }]
    }
  }
}]"
```

Tune cadence + counts via env vars on the cron task:
- `MORNING_CRON_REENRICH=5`
- `MORNING_CRON_SOURCE=5`
- `MORNING_CRON_ENRICH_NEW=true`

---

## 7. Frontend (React SPA)

The React app in `../src/` is built separately. Two options:

**Option A: Vercel** (zero-config; what the original `DEPLOY.md` recommends)
- Import the repo on Vercel, set `VITE_API_URL` to the ALB URL
- Update Django's `CORS_ALLOWED_ORIGINS` to include the Vercel URL

**Option B: CloudFront + S3** (everything-on-AWS)
- `cd .. && npm run build` (with `VITE_API_URL` set in `.env.production`)
- `aws s3 sync dist/ s3://your-bucket/` then invalidate CloudFront
- A `vercel.json`-equivalent rewrite (SPA fallback) is configured at the
  CloudFront distribution: route `404` errors to `/index.html`

---

## 8. Operational notes

- **Logs**: CloudWatch Logs, group `/ecs/crm-api`. Cron logs are in the
  same group with stream prefix matching the cron task.
- **Cost** (rough, us-east-1):
  - Fargate 0.5vCPU/1GB always-on: ~$15/mo
  - RDS db.t4g.micro: ~$13/mo
  - ALB: ~$18/mo
  - EventBridge + cron Fargate ~5min/day: ~$1/mo
  - Anthropic API at 5+5 daily: ~$45/mo
  - **Total: ~$92/mo** (vs. ~$55/mo on Render hobby — AWS is more for
    less-managed flexibility)
- **Scaling**: bump `desired-count` on the ECS service; ALB rotates traffic.
- **Secret rotation**: rotate via Secrets Manager, then force a new
  deployment so tasks restart and re-pull secrets.
- **DB backups**: RDS automated backups are on by default; verify the
  retention window meets your needs (default 7 days, max 35).
