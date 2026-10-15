---
id: devops
title: DevOps
icon: ⚙️
order: 6
description: Văn hóa DevOps, Git, CI/CD, Docker, Kubernetes, Linux, IaC, cloud, monitoring, bảo mật và SRE
---

# Văn hóa DevOps và CI/CD

## DevOps là gì? Nó có phải chỉ là một vị trí công việc? [junior]
DevOps là **văn hóa và tập hợp thực hành** kết hợp Development và Operations nhằm giao phần mềm **nhanh, thường xuyên và ổn định**. Không chỉ là một chức danh hay một bộ công cụ.

Nguyên tắc cốt lõi (mô hình **CALMS**):
- **Culture**: phá bỏ "silo" giữa dev, QA, ops; trách nhiệm chung ("you build it, you run it").
- **Automation**: tự động hóa build, test, deploy, hạ tầng (IaC).
- **Lean**: batch nhỏ, giảm lãng phí, giảm thời gian chờ.
- **Measurement**: đo lường mọi thứ (metrics, logs, DORA).
- **Sharing**: chia sẻ kiến thức, blameless postmortem.

Vòng đời: Plan → Code → Build → Test → Release → Deploy → Operate → Monitor → (feedback) Plan.

**Lưu ý / bẫy thường gặp:** lập riêng một "team DevOps" làm cầu nối nhưng dev vẫn ném code qua tường cho team đó deploy thì chỉ là tạo silo mới — đó là anti-pattern.

## Phân biệt Continuous Integration, Continuous Delivery và Continuous Deployment. [junior]
- **Continuous Integration (CI)**: dev merge code vào nhánh chính **thường xuyên** (ít nhất mỗi ngày); mỗi lần push tự động build + chạy test + phân tích code → phát hiện lỗi tích hợp sớm.
- **Continuous Delivery**: mọi thay đổi qua CI đều được đóng gói và **luôn ở trạng thái sẵn sàng release**; deploy lên production cần **một bước phê duyệt thủ công**.
- **Continuous Deployment**: tiến thêm một bước — mọi thay đổi pass pipeline được **tự động deploy lên production**, không cần người can thiệp.

```text
Commit → Build → Unit test → Package → Deploy Staging → Integration/E2E test → [Approve] → Production
          |------------- CI -------------|
          |------------------ Continuous Delivery (có bước Approve) ------------------|
          |------------------ Continuous Deployment (không có Approve) ---------------|
```

**Lưu ý / bẫy thường gặp:** Continuous Deployment chỉ an toàn khi có bộ test tự động tốt, monitoring, feature flag và khả năng rollback nhanh.

## DORA metrics là gì? [mid]
DORA (DevOps Research and Assessment) đưa ra 4 chỉ số đo hiệu quả giao phần mềm:

| Metric | Ý nghĩa | Elite team |
|---|---|---|
| **Deployment Frequency** | Tần suất deploy lên production | Nhiều lần mỗi ngày |
| **Lead Time for Changes** | Từ commit đến chạy trên production | < 1 ngày |
| **Change Failure Rate** | % deploy gây sự cố cần khắc phục | 0–15% |
| **Mean Time to Restore (MTTR)** | Thời gian khôi phục khi có sự cố | < 1 giờ |

Hai chỉ số đầu đo **tốc độ (throughput)**, hai chỉ số sau đo **ổn định (stability)**. Nghiên cứu cho thấy team tốt cải thiện được cả hai cùng lúc chứ không phải đánh đổi. Các phiên bản gần đây bổ sung thêm **reliability** và *deployment rework rate*.

Cách cải thiện: batch nhỏ, trunk-based development, tự động hóa test/deploy, feature flag, observability tốt.

**Lưu ý / bẫy thường gặp:** dùng metric để so sánh hay phạt cá nhân sẽ khiến người ta "game" số liệu — nên dùng để team tự cải tiến.

# Git và quản lý source code

## git merge và git rebase khác nhau thế nào? [mid]
Cả hai đều tích hợp thay đổi từ nhánh này sang nhánh khác.

- **Merge**: tạo **merge commit** nối hai lịch sử; không thay đổi commit cũ → an toàn, giữ nguyên ngữ cảnh, nhưng lịch sử có nhiều nhánh rẽ.
- **Rebase**: "di chuyển" các commit của nhánh hiện tại lên đỉnh nhánh đích bằng cách **tạo lại commit mới** (hash mới) → lịch sử thẳng, dễ đọc.

```bash
git checkout feature
git rebase main                # đưa feature lên đỉnh main
git rebase -i HEAD~3           # squash/sửa 3 commit gần nhất (trên máy local)
git checkout main
git merge --no-ff feature      # luôn tạo merge commit
```

| | Merge | Rebase |
|---|---|---|
| Lịch sử | Thật, có nhánh | Thẳng, được viết lại |
| Đổi hash commit | Không | Có |
| Giải conflict | Một lần | Có thể nhiều lần (từng commit) |

**Lưu ý / bẫy thường gặp:** **không rebase nhánh đã push và người khác đang dùng** (golden rule). Nếu buộc phải force push nhánh cá nhân, dùng `git push --force-with-lease` thay vì `--force`.

## So sánh GitFlow và trunk-based development. [mid]
**GitFlow:**
- Nhánh: `main` (production), `develop`, `feature/*`, `release/*`, `hotfix/*`.
- Phù hợp: sản phẩm release theo version định kỳ, nhiều version song song (phần mềm on-premise, mobile app).
- Nhược: nhánh sống lâu → merge hell, tích hợp muộn, chậm.

**GitHub Flow:** chỉ `main` + feature branch ngắn + Pull Request; merge xong là deploy.

**Trunk-based development:**
- Mọi người commit vào `main` (trunk) trực tiếp hoặc qua nhánh **rất ngắn** (< 1–2 ngày).
- Tính năng dở dang được ẩn bằng **feature flag**.
- Release từ trunk (hoặc nhánh release cắt ra từ trunk).
- Là nền tảng cho CI/CD thực thụ; được DORA khuyến nghị.

| | GitFlow | Trunk-based |
|---|---|---|
| Độ dài nhánh | Dài | Rất ngắn |
| Tần suất release | Theo đợt | Liên tục |
| Yêu cầu | Quy trình chặt | Test tự động mạnh, feature flag |

**Lưu ý / bẫy thường gặp:** không có chiến lược "tốt nhất" — chọn theo mô hình release và độ trưởng thành của hệ thống test.

## git reset, git revert và git restore khác nhau thế nào? [mid]
- **`git revert <commit>`**: tạo **commit mới** đảo ngược thay đổi của commit cũ. **Không viết lại lịch sử** → an toàn cho nhánh chung đã push.
- **`git reset`**: di chuyển HEAD/nhánh về commit khác → **viết lại lịch sử**, chỉ dùng trên local.
  - `--soft`: giữ thay đổi ở staging.
  - `--mixed` (mặc định): giữ thay đổi ở working directory, bỏ staging.
  - `--hard`: **xóa sạch** thay đổi.
- **`git restore`**: khôi phục file trong working tree/staging (thay cho `git checkout -- file`).

```bash
git revert a1b2c3d                # hoàn tác commit đã lên main
git revert -m 1 <merge-commit>    # revert một merge commit
git reset --soft HEAD~1           # bỏ commit cuối, giữ code để commit lại
git restore --staged app.js       # bỏ file khỏi staging
git reflog                        # cứu lại commit "mất" sau reset --hard
```

**Lưu ý / bẫy thường gặp:** `reset --hard` trên nhánh chung rồi force push là thảm họa cho cả team; `git reflog` là phao cứu sinh vì commit vẫn tồn tại một thời gian.

## git cherry-pick là gì, khi nào dùng? [junior]
`cherry-pick` **sao chép một (hoặc vài) commit cụ thể** từ nhánh khác sang nhánh hiện tại, tạo commit mới với nội dung tương tự (hash khác).

```bash
git checkout release/1.2
git cherry-pick 9f8e7d6               # lấy 1 commit
git cherry-pick A..B                  # lấy dải commit (không gồm A)
git cherry-pick -x 9f8e7d6            # ghi chú "cherry picked from commit ..."
git cherry-pick --continue / --abort  # sau khi xử lý conflict
```

Use case:
- Đưa **hotfix** từ `main` sang nhánh release đang chạy (hoặc ngược lại).
- Lấy một bản sửa lỗi từ nhánh feature chưa sẵn sàng merge.
- Backport sang các version cũ đang được hỗ trợ.

**Lưu ý / bẫy thường gặp:** lạm dụng cherry-pick tạo **commit trùng lặp** trên nhiều nhánh, dễ conflict khi merge sau này và khó truy vết. Khi commit phụ thuộc commit khác chưa được pick, code có thể không build được.

## Giải quyết merge conflict và giữ chất lượng code qua Pull Request như thế nào? [junior]
**Conflict** xảy ra khi hai nhánh sửa cùng vùng code. Cách xử lý:
1. `git fetch` và merge/rebase nhánh đích mới nhất vào nhánh mình.
2. Mở file có marker `<<<<<<<`, `=======`, `>>>>>>>`, hiểu ý định của **cả hai** thay đổi rồi sửa.
3. Build + chạy test lại, `git add`, tiếp tục merge/rebase.

Giảm conflict: nhánh ngắn, PR nhỏ, đồng bộ thường xuyên với main, format code tự động thống nhất.

**Pull Request tốt:**
- Mô tả rõ **what/why**, liên kết work item, ảnh chụp với thay đổi UI.
- Kích thước nhỏ (< 400 dòng) để review hiệu quả.
- **Branch protection**: bắt buộc CI pass, ít nhất 1–2 reviewer, cấm push thẳng vào main, CODEOWNERS.
- Checks tự động: lint, unit test, coverage, SAST, kiểm tra secret.
- `.gitignore` đúng, không commit file build, file cấu hình chứa mật khẩu.

**Lưu ý / bẫy thường gặp:** giải conflict bằng cách chọn "accept mine" cho toàn bộ file là cách nhanh nhất để làm mất code của đồng nghiệp.

# CI/CD pipeline và chiến lược deploy

## Một CI/CD pipeline điển hình gồm những stage nào? Artifact và environment là gì? [mid]
Stage điển hình:
1. **Source**: trigger khi push / mở PR / tạo tag.
2. **Build**: restore dependency, compile.
3. **Test**: unit test, code coverage.
4. **Quality & Security**: lint, SonarQube, SAST, dependency scan (SCA), secret scan.
5. **Package**: tạo **artifact** — Docker image, NuGet/npm package, file zip, JAR.
6. **Publish**: đẩy artifact lên registry (ACR, ECR, Docker Hub, Nexus, Artifactory).
7. **Deploy** lần lượt Dev → QA/Staging → Production, kèm smoke test, integration/E2E test.
8. **Approval / gate** trước production.

- **Artifact**: sản phẩm build **bất biến (immutable)**, có version (vd tag theo commit SHA). Nguyên tắc **build once, deploy many**: cùng một artifact được promote qua mọi môi trường; chỉ cấu hình thay đổi theo môi trường.
- **Environment**: đích deploy (dev, staging, prod) với cấu hình, secret, quyền truy cập, quy tắc approval riêng.

**Lưu ý / bẫy thường gặp:** build lại code riêng cho từng môi trường khiến thứ đã test ở staging không phải thứ chạy trên production. Pipeline nên chạy nhanh (CI < 10 phút) để dev nhận phản hồi sớm.

## Viết một workflow GitHub Actions cơ bản để build, test và push Docker image? [mid]
```yaml
name: ci
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'

      - name: Restore & test
        run: |
          dotnet restore
          dotnet test --configuration Release --no-restore

      - name: Login GHCR
        if: github.ref == 'refs/heads/main'
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build & push
        if: github.ref == 'refs/heads/main'
        uses: docker/build-push-action@v6
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
```

Khái niệm: **workflow** (file YAML trong `.github/workflows`) → **job** (chạy trên runner, song song mặc định, nối bằng `needs`) → **step** (lệnh `run` hoặc `uses` action). Có `environments` với required reviewers, `matrix` build nhiều phiên bản, cache dependency, reusable workflow.

**Lưu ý / bẫy thường gặp:** pin action theo version/commit SHA, đặt `permissions` tối thiểu, không in secret ra log, dùng **OIDC** để đăng nhập cloud thay vì lưu access key dài hạn.

## So sánh Jenkins, GitHub Actions, GitLab CI và Azure DevOps Pipelines. [mid]
| | Jenkins | GitHub Actions | GitLab CI | Azure DevOps |
|---|---|---|---|---|
| Mô hình | Self-hosted, open source | SaaS gắn GitHub | Tích hợp GitLab (SaaS/self-hosted) | SaaS hoặc Azure DevOps Server (on-prem, trước là TFS) |
| Cấu hình | `Jenkinsfile` (Groovy) | YAML `.github/workflows` | `.gitlab-ci.yml` | `azure-pipelines.yml` (YAML) hoặc Classic UI |
| Runner/agent | Agent tự quản | GitHub-hosted / self-hosted | Shared / specific runner | Microsoft-hosted / self-hosted agent |
| Mở rộng | Hàng nghìn plugin | Marketplace action | Template, include | Task, extension, template |
| Điểm mạnh | Linh hoạt tối đa | Đơn giản, hệ sinh thái lớn | All-in-one DevSecOps | Boards + Repos + Pipelines + Artifacts + Test Plans, mạnh với .NET/Azure |
| Điểm yếu | Bảo trì, bảo mật plugin | Gắn chặt GitHub | — | YAML dài dòng |

Khái niệm tương đương: Jenkins *stage/step*, GitLab *stage/job*, Azure DevOps *stage → job → step*, có **environment** + **approvals and checks**, **variable groups** liên kết Key Vault.

```groovy
pipeline {
  agent any
  stages {
    stage('Build') { steps { sh 'dotnet build' } }
    stage('Test')  { steps { sh 'dotnet test' } }
  }
}
```

**Lưu ý / bẫy thường gặp:** câu trả lời tốt là nêu tiêu chí chọn (nơi đặt code, yêu cầu on-prem, chi phí, đội vận hành) chứ không phải "tool X tốt nhất".

## So sánh các chiến lược deployment: rolling, blue-green, canary, recreate. [senior]
| Chiến lược | Cách làm | Ưu điểm | Nhược điểm |
|---|---|---|---|
| **Recreate** | Tắt bản cũ rồi bật bản mới | Đơn giản, không chạy song song 2 version | Có downtime |
| **Rolling** | Thay dần từng instance (mặc định của K8s Deployment) | Không downtime, không cần gấp đôi tài nguyên | Hai version chạy song song, rollback chậm |
| **Blue-Green** | Dựng môi trường mới (green) song song, test xong chuyển toàn bộ traffic từ blue | Chuyển và rollback gần như tức thì | Tốn gấp đôi tài nguyên, khó với DB migration |
| **Canary** | Chuyển một phần nhỏ traffic (1% → 10% → 50% → 100%) sang bản mới, theo dõi metric | Giảm phạm vi ảnh hưởng (blast radius), kiểm chứng bằng traffic thật | Cần routing thông minh, monitoring tốt, phức tạp |
| **A/B testing** | Định tuyến theo thuộc tính user để đo hiệu quả nghiệp vụ | Ra quyết định sản phẩm | Không phải chiến lược an toàn kỹ thuật |
| **Shadow** | Nhân bản traffic sang bản mới, bỏ kết quả | Test với tải thật, không ảnh hưởng user | Cẩn thận side-effect (ghi DB, gửi email) |

Công cụ: Argo Rollouts, Flagger, service mesh (Istio), slot swap của Azure App Service, AWS CodeDeploy.

**Lưu ý / bẫy thường gặp:** blue-green/canary/rolling đều đòi hỏi schema DB **tương thích ngược** giữa hai version (expand–contract). Canary nên có **automated analysis** (error rate, latency) để tự rollback.

## Feature flag là gì? Lợi ích và rủi ro? [mid]
Feature flag (feature toggle) là cơ chế **bật/tắt tính năng lúc runtime** mà không cần deploy lại — tách **deploy** (đưa code lên) khỏi **release** (cho user dùng).

```csharp
if (await featureManager.IsEnabledAsync("NewPayroll"))
    return newPayrollService.Calculate(input);
return legacyPayrollService.Calculate(input);
```

Loại flag:
- **Release toggle**: ẩn tính năng chưa xong (hỗ trợ trunk-based).
- **Experiment toggle**: A/B testing.
- **Ops toggle / kill switch**: tắt nhanh tính năng nặng khi sự cố.
- **Permission toggle**: bật theo tenant/gói dịch vụ/nhóm beta.

Công cụ: LaunchDarkly, Unleash, Flagsmith, Azure App Configuration, `Microsoft.FeatureManagement`.

Lợi ích: rollback tức thời, release dần theo % user, dark launch, giảm merge conflict.

Rủi ro: **nợ kỹ thuật** khi flag cũ không được xóa, số tổ hợp cần test tăng, logic rối.

**Lưu ý / bẫy thường gặp:** mỗi flag nên có owner và hạn xóa; flag mặc định phải **an toàn** khi hệ thống quản lý flag không truy cập được.

## Rollback khi deploy lỗi và xử lý database migration trong pipeline? [senior]
**Chiến lược rollback:**
- **Redeploy artifact cũ** (vì artifact bất biến và có version): `kubectl rollout undo deployment/api`, `helm rollback api 12`, swap lại slot.
- Blue-green: chuyển traffic về môi trường cũ.
- Feature flag: tắt tính năng thay vì rollback code.
- **Roll forward**: sửa nhanh và deploy bản mới — đôi khi an toàn hơn nếu đã có dữ liệu ghi theo format mới.

**Database migration:**
- Chạy migration như một bước riêng trong pipeline (EF Core migration bundle, Flyway, Liquibase, DbUp), có version, idempotent.
- Áp dụng **expand–contract**: migration chỉ thêm (cột nullable, bảng mới) để version cũ vẫn chạy; xóa cột cũ ở release sau.
- Tránh down-migration có mất dữ liệu; backup/snapshot trước migration rủi ro cao.
- Không để nhiều pod cùng chạy migration lúc startup (race condition) — dùng job riêng hoặc lock.

**Lưu ý / bẫy thường gặp:** rollback code thì dễ, rollback dữ liệu thì khó. Luôn có **health check + smoke test** sau deploy và tiêu chí rollback rõ ràng (error rate, latency) — tốt nhất là tự động.

# Docker

## Docker image và container khác nhau thế nào? Container khác VM ra sao? [junior]
- **Image**: template **chỉ đọc**, gồm nhiều layer (filesystem + metadata: lệnh chạy, env, port). Giống "class".
- **Container**: một **instance đang chạy** của image, thêm một **writable layer** mỏng ở trên cùng. Giống "object". Xóa container thì dữ liệu ở writable layer mất.

```bash
docker build -t hrm-api:1.0 .
docker run -d --name api -p 8080:8080 hrm-api:1.0
docker ps; docker logs -f api; docker exec -it api sh
```

| | Container | Virtual Machine |
|---|---|---|
| Ảo hóa | Mức hệ điều hành (chung kernel host) | Mức phần cứng (hypervisor), mỗi VM một OS riêng |
| Khởi động | Mili giây – giây | Phút |
| Kích thước | MB | GB |
| Cô lập | Yếu hơn (namespace, cgroup) | Mạnh |

Container dựa trên Linux **namespaces** (cô lập PID, network, mount, user...) và **cgroups** (giới hạn CPU, RAM).

**Lưu ý / bẫy thường gặp:** container Linux không chạy trực tiếp trên kernel Windows — Docker Desktop dùng một VM Linux (WSL2) bên dưới.

## Layer trong Docker image hoạt động thế nào? Làm sao tận dụng build cache? [mid]
Mỗi instruction `RUN`, `COPY`, `ADD` tạo một **layer** mới (các instruction như `ENV`, `CMD` chỉ thêm metadata). Layer là bất biến, được chia sẻ giữa các image và container (union filesystem — overlay2), giúp tiết kiệm dung lượng và băng thông khi pull.

**Build cache**: Docker tái sử dụng layer nếu instruction và input không đổi. Khi một layer thay đổi, **mọi layer phía sau đều phải build lại**.

→ Sắp xếp từ ít thay đổi đến hay thay đổi: copy file định nghĩa dependency trước, restore, rồi mới copy source.

```dockerfile
# Tốt: chỉ restore lại khi .csproj thay đổi
COPY *.csproj ./
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app

# Gộp lệnh và dọn cache trong cùng layer
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
```

**Lưu ý / bẫy thường gặp:** xóa file ở layer sau **không làm image nhỏ đi** vì file vẫn nằm ở layer trước — và secret đã `COPY` vào layer nào thì vẫn đọc lại được bằng `docker history`/giải nén image. Dùng `.dockerignore` để không gửi `bin/`, `obj/`, `node_modules`, `.git` vào build context.

## Multi-stage build là gì và tại sao nên dùng? [mid]
Multi-stage build dùng nhiều `FROM` trong một Dockerfile: stage đầu dùng image đầy đủ SDK để build, stage cuối chỉ **copy kết quả build** sang image runtime nhỏ gọn.

```dockerfile
# Stage 1: build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY *.csproj ./
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish --no-restore

# Stage 2: runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
USER app
EXPOSE 8080
ENTRYPOINT ["dotnet", "Hrm.Api.dll"]
```

Lợi ích:
- Image cuối **nhỏ hơn nhiều** (không có SDK, compiler, source code) → pull nhanh, khởi động nhanh.
- **Bề mặt tấn công nhỏ hơn**, ít CVE hơn.
- Một Dockerfile duy nhất, build tái lập được, không cần script build ngoài.
- Có thể build đến stage cụ thể: `docker build --target build .` (vd để chạy test).

**Lưu ý / bẫy thường gặp:** với Go/Rust có thể dùng `scratch` hoặc `distroless` làm stage cuối; nhưng image quá tối giản sẽ không có shell để debug — cân nhắc dùng `kubectl debug`/ephemeral container.

## Các best practice khi viết Dockerfile? [mid]
- Dùng **base image chính thức, nhỏ, pin version** cụ thể (`node:20.11-alpine`, hoặc digest), tránh `latest`.
- **Multi-stage build** để tách build và runtime.
- Sắp xếp instruction tối ưu cache; gộp `RUN` liên quan và dọn cache package trong cùng layer.
- Có **`.dockerignore`**.
- **Chạy bằng non-root user** (`USER app`).
- **Không đưa secret vào image** (không `ENV PASSWORD=...`, không `COPY .env`); dùng BuildKit secret `RUN --mount=type=secret` khi build, inject secret lúc runtime.
- Mỗi container **một tiến trình/một trách nhiệm**.
- Dùng exec form `["executable", "arg"]` cho `CMD`/`ENTRYPOINT` để nhận được tín hiệu `SIGTERM` → graceful shutdown.
- Ưu tiên `COPY` hơn `ADD` (ADD tự giải nén, tải URL — khó lường).
- Khai báo `HEALTHCHECK` (Docker/Compose) hoặc probe (K8s); log ra **stdout/stderr**.
- Quét lỗ hổng image (Trivy, Grype, Docker Scout) trong pipeline.

```dockerfile
FROM node:20.11-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
USER node
CMD ["node", "server.js"]
```

**Lưu ý / bẫy thường gặp:** chạy container bằng root cộng với mount Docker socket (`/var/run/docker.sock`) gần như tương đương cho quyền root trên host.

## CMD và ENTRYPOINT khác nhau thế nào? [junior]
- **`ENTRYPOINT`**: lệnh **chính, cố định** mà container luôn chạy. Chỉ bị ghi đè bằng `docker run --entrypoint`.
- **`CMD`**: **tham số mặc định** (hoặc lệnh mặc định nếu không có ENTRYPOINT); bị ghi đè dễ dàng bởi tham số đứng sau tên image trong `docker run`.

Kết hợp phổ biến: ENTRYPOINT là executable, CMD là tham số mặc định.

```dockerfile
ENTRYPOINT ["curl"]
CMD ["--help"]
```
```bash
docker run my-curl                      # chạy: curl --help
docker run my-curl https://example.com  # chạy: curl https://example.com
```

**Shell form vs exec form:**
- Exec form `["dotnet", "app.dll"]`: process chạy trực tiếp với **PID 1**, nhận được tín hiệu `SIGTERM`.
- Shell form `dotnet app.dll`: chạy qua `/bin/sh -c` → shell là PID 1, tín hiệu có thể không được chuyển tiếp → container bị kill cứng sau timeout (10s mặc định ở Docker, 30s ở K8s).

**Lưu ý / bẫy thường gặp:** khi dùng script `entrypoint.sh` để chuẩn bị môi trường, kết thúc script bằng `exec "$@"` để tiến trình chính thay thế shell và nhận tín hiệu đúng.

## Docker volume, bind mount và tmpfs khác nhau thế nào? [mid]
Dữ liệu ghi vào writable layer của container sẽ mất khi container bị xóa, và ghi vào đó chậm. Để lưu dữ liệu bền vững:

| | Volume | Bind mount | tmpfs |
|---|---|---|---|
| Vị trí | Docker quản lý (`/var/lib/docker/volumes`) | Đường dẫn bất kỳ trên host | Bộ nhớ RAM |
| Quản lý | `docker volume create/ls/rm` | Do người dùng | Mất khi container dừng |
| Use case | Dữ liệu DB, dữ liệu bền vững trên production | Mount source code khi dev, file cấu hình | Dữ liệu tạm, nhạy cảm |
| Tính di động | Cao, hỗ trợ driver (NFS, cloud) | Phụ thuộc cấu trúc thư mục host | — |

```bash
docker volume create pgdata
docker run -d -v pgdata:/var/lib/postgresql/data postgres:16      # named volume
docker run -d -v "$(pwd)/src:/app/src" my-dev-image                # bind mount
docker run -d --mount type=tmpfs,destination=/tmp my-app           # tmpfs
```

**Lưu ý / bẫy thường gặp:** bind mount hay gặp lỗi quyền (UID trong container khác UID host) và hiệu năng kém trên Docker Desktop (Windows/macOS). `docker compose down -v` sẽ **xóa luôn volume** — cẩn thận với dữ liệu DB.

## Docker network hoạt động thế nào? [mid]
Các network driver chính:
- **bridge** (mặc định): mạng ảo riêng trên host; container ra ngoài qua NAT, nhận traffic từ ngoài qua publish port `-p host:container`.
- **User-defined bridge**: nên dùng thay bridge mặc định — có **DNS nội bộ**, container gọi nhau bằng **tên container/service**.
- **host**: dùng chung network stack của host, không cô lập, không cần map port (chỉ đầy đủ trên Linux).
- **none**: không có mạng.
- **overlay**: nối container trên nhiều host (Docker Swarm).
- **macvlan**: container có MAC/IP riêng trong mạng vật lý.

```bash
docker network create backend
docker run -d --name db  --network backend postgres:16
docker run -d --name api --network backend -p 8080:8080 \
  -e ConnectionStrings__Default="Host=db;Database=hrm" hrm-api
```

**Lưu ý / bẫy thường gặp:** bên trong container, `localhost` là **chính container đó**, không phải host hay container khác — lỗi rất hay gặp khi app gọi DB bằng `localhost`. Muốn gọi dịch vụ trên máy host từ Docker Desktop dùng `host.docker.internal`. `EXPOSE` chỉ là tài liệu hóa, không publish port.

## Docker Compose dùng để làm gì? Viết một ví dụ. [junior]
Docker Compose định nghĩa và chạy **ứng dụng nhiều container** bằng một file YAML — rất phù hợp cho môi trường dev, test tích hợp, demo. Compose tự tạo network chung để các service gọi nhau bằng tên service.

```yaml
services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      ConnectionStrings__Default: "Host=db;Database=hrm;Username=hrm;Password=${DB_PASSWORD}"
      Redis__Host: "cache:6379"
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: hrm
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: hrm
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hrm"]
      interval: 5s
      retries: 10
  cache:
    image: redis:7-alpine
volumes:
  pgdata:
```

```bash
docker compose up -d --build
docker compose logs -f api
docker compose down
```

**Lưu ý / bẫy thường gặp:** `depends_on` mặc định chỉ đợi container **khởi động**, không đợi service **sẵn sàng** — cần `condition: service_healthy` cùng healthcheck, và app vẫn nên có retry khi kết nối. Biến `${...}` lấy từ file `.env` — không commit file này lên Git.

# Kubernetes

## Kiến trúc Kubernetes gồm những thành phần nào? [mid]
**Control plane:**
- **kube-apiserver**: cổng giao tiếp duy nhất (REST), mọi thành phần và `kubectl` đều đi qua đây.
- **etcd**: key-value store phân tán lưu **toàn bộ trạng thái** cluster — cần backup.
- **kube-scheduler**: chọn node phù hợp cho pod mới (dựa trên resource requests, affinity, taint/toleration).
- **kube-controller-manager**: chạy các controller (Deployment, ReplicaSet, Node, Job...) liên tục đưa **trạng thái thực tế về trạng thái mong muốn** (reconciliation loop).
- **cloud-controller-manager**: tích hợp cloud (load balancer, disk).

**Worker node:**
- **kubelet**: agent đảm bảo container của pod chạy đúng spec, chạy probe.
- **kube-proxy**: cấu hình rule mạng (iptables/IPVS) cho Service.
- **Container runtime**: containerd, CRI-O (từ 1.24 bỏ dockershim — image Docker vẫn chạy bình thường).

Bổ sung: CNI plugin (Calico, Cilium, Flannel), CoreDNS.

**Lưu ý / bẫy thường gặp:** Kubernetes là hệ thống **khai báo (declarative)** — bạn mô tả trạng thái mong muốn bằng YAML, controller lo phần còn lại; đây là ý quan trọng nhất cần nói khi được hỏi "K8s hoạt động thế nào".

## Pod, ReplicaSet, Deployment, StatefulSet, DaemonSet khác nhau thế nào? [mid]
- **Pod**: đơn vị nhỏ nhất, gồm 1+ container **chung network namespace (cùng IP) và volume**. Pod là tạm thời (ephemeral), IP thay đổi khi tạo lại. Sidecar pattern: container phụ trợ (log shipper, proxy) chạy cùng pod.
- **ReplicaSet**: đảm bảo luôn có N bản sao pod. Hiếm khi tạo trực tiếp.
- **Deployment**: quản lý ReplicaSet, hỗ trợ **rolling update, rollback**, lịch sử revision — dùng cho ứng dụng **stateless**.
- **StatefulSet**: cho ứng dụng **stateful** (DB, Kafka): tên pod ổn định (`db-0`, `db-1`), thứ tự khởi động/tắt, mỗi pod có PersistentVolume riêng, dùng với headless service.
- **DaemonSet**: chạy **một pod trên mỗi node** (agent log, monitoring, CNI).
- **Job / CronJob**: tác vụ chạy đến khi hoàn thành / theo lịch.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hrm-api
spec:
  replicas: 3
  selector:
    matchLabels: { app: hrm-api }
  strategy:
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
  template:
    metadata:
      labels: { app: hrm-api }
    spec:
      containers:
        - name: api
          image: registry/hrm-api:1.4.2
          ports: [{ containerPort: 8080 }]
          resources:
            requests: { cpu: 250m, memory: 256Mi }
            limits: { memory: 512Mi }
```

**Lưu ý / bẫy thường gặp:** không chạy pod "trần" trên production — pod chết sẽ không ai tạo lại.

## Các loại Service trong Kubernetes? [mid]
Service cung cấp **địa chỉ ổn định (IP ảo + DNS name)** và load balancing cho một nhóm pod được chọn bằng **label selector** (vì IP pod thay đổi liên tục).

| Loại | Mô tả | Dùng khi |
|---|---|---|
| **ClusterIP** (mặc định) | IP nội bộ cluster | Giao tiếp giữa các service bên trong |
| **NodePort** | Mở port (30000–32767) trên mọi node | Test, môi trường on-prem đơn giản |
| **LoadBalancer** | Tạo load balancer của cloud trỏ vào service | Expose service ra Internet trên cloud |
| **ExternalName** | CNAME DNS tới tên miền ngoài | Trừu tượng hóa dịch vụ bên ngoài |
| **Headless** (`clusterIP: None`) | Không có IP ảo, DNS trả về IP từng pod | StatefulSet, client tự load balance |

```yaml
apiVersion: v1
kind: Service
metadata:
  name: hrm-api
spec:
  type: ClusterIP
  selector: { app: hrm-api }
  ports:
    - port: 80
      targetPort: 8080
```
DNS nội bộ: `hrm-api.<namespace>.svc.cluster.local`.

**Lưu ý / bẫy thường gặp:** service không có endpoint (`kubectl get endpoints hrm-api` trống) thường do **selector không khớp label** của pod hoặc pod chưa Ready.

## Ingress là gì? Khác Service LoadBalancer thế nào? [mid]
**Ingress** định tuyến traffic **HTTP/HTTPS (L7)** từ bên ngoài vào các Service bên trong dựa trên **host** và **path**, kèm TLS termination. Cần một **Ingress Controller** thực thi (NGINX Ingress, Traefik, HAProxy, AWS ALB, Azure Application Gateway).

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hrm
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
spec:
  ingressClassName: nginx
  tls:
    - hosts: [hrm.example.com]
      secretName: hrm-tls
  rules:
    - host: hrm.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service: { name: hrm-api, port: { number: 80 } }
          - path: /
            pathType: Prefix
            backend:
              service: { name: hrm-web, port: { number: 80 } }
```

| | Service LoadBalancer | Ingress |
|---|---|---|
| Tầng | L4 (TCP/UDP) | L7 (HTTP) |
| Chi phí | Mỗi service một load balancer cloud | Một entry point cho nhiều service |
| Định tuyến host/path, TLS | Không | Có |

**Lưu ý / bẫy thường gặp:** **Gateway API** là thế hệ kế tiếp của Ingress (linh hoạt hơn, tách vai trò rõ ràng); dự án ingress-nginx cộng đồng đã thông báo ngừng phát triển, nên nắm xu hướng chuyển sang Gateway API.

## ConfigMap và Secret dùng thế nào? Secret có thực sự an toàn? [mid]
- **ConfigMap**: lưu cấu hình **không nhạy cảm** (URL, feature setting, file cấu hình).
- **Secret**: lưu dữ liệu nhạy cảm (mật khẩu, token, chứng chỉ TLS).

Cách đưa vào pod: **biến môi trường** (`env`, `envFrom`) hoặc **mount thành file** (volume). Mount dạng file được cập nhật khi ConfigMap đổi (sau vài chục giây); biến môi trường thì phải restart pod.

```yaml
envFrom:
  - configMapRef: { name: hrm-config }
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef: { name: hrm-db, key: password }
```
```bash
kubectl create secret generic hrm-db --from-literal=password='S3cr3t!'
```

**Secret có an toàn không?** Mặc định Secret chỉ được **mã hóa base64 (không phải mã hóa)** và lưu trong etcd. Cần thêm:
- Bật **encryption at rest** cho etcd (KMS provider).
- **RBAC** chặt — ai `get secrets` được trong namespace là đọc được.
- Không commit manifest Secret lên Git; dùng **External Secrets Operator**, **Sealed Secrets**, **SOPS**, hoặc CSI driver với Vault / Azure Key Vault / AWS Secrets Manager.

**Lưu ý / bẫy thường gặp:** đổi ConfigMap không tự rolling restart Deployment — dùng `kubectl rollout restart` hoặc annotation checksum (Helm).

## Liveness, readiness và startup probe khác nhau thế nào? [mid]
| Probe | Câu hỏi | Khi thất bại |
|---|---|---|
| **Liveness** | Container còn "sống" không (hay bị treo/deadlock)? | kubelet **restart** container |
| **Readiness** | Container đã sẵn sàng nhận traffic chưa? | Bị **loại khỏi endpoint** của Service (không restart) |
| **Startup** | Ứng dụng đã khởi động xong chưa? | Hoãn liveness/readiness đến khi pass; quá ngưỡng thì restart |

Kiểu kiểm tra: `httpGet`, `tcpSocket`, `exec`, `grpc`.

```yaml
startupProbe:
  httpGet: { path: /health/live, port: 8080 }
  failureThreshold: 30
  periodSeconds: 5
livenessProbe:
  httpGet: { path: /health/live, port: 8080 }
  periodSeconds: 10
readinessProbe:
  httpGet: { path: /health/ready, port: 8080 }
  periodSeconds: 5
```

**Lưu ý / bẫy thường gặp:**
- **Không** đưa kiểm tra dependency (DB, Redis) vào **liveness** — DB chậm sẽ khiến toàn bộ pod bị restart hàng loạt (cascading failure). Dependency thuộc về readiness (và cũng nên cân nhắc).
- Thiếu startup probe với app khởi động chậm sẽ bị liveness kill liên tục → CrashLoopBackOff.
- Kết hợp readiness với `preStop` + graceful shutdown để rolling update không rớt request.

## HPA hoạt động thế nào? Requests và limits ảnh hưởng ra sao? [senior]
**HorizontalPodAutoscaler** tự tăng/giảm số replica dựa trên metric (CPU, memory từ **metrics-server**, hoặc custom/external metric như request/s, độ dài queue qua Prometheus Adapter hoặc **KEDA**).

Công thức: `desiredReplicas = ceil(currentReplicas × currentMetric / targetMetric)`.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: hrm-api }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: hrm-api }
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target: { type: Utilization, averageUtilization: 70 }
```

**Requests vs limits:**
- `requests`: lượng tài nguyên được **đảm bảo**, scheduler dùng để xếp pod; HPA tính % utilization **dựa trên requests** → thiếu requests thì HPA CPU không hoạt động.
- `limits`: mức trần. Vượt CPU limit → bị **throttle**; vượt memory limit → bị **OOMKilled**.
- QoS class: Guaranteed / Burstable / BestEffort, ảnh hưởng thứ tự bị evict.

Các loại autoscaling khác: **VPA** (điều chỉnh requests), **Cluster Autoscaler / Karpenter** (thêm node).

**Lưu ý / bẫy thường gặp:** đặt CPU limit quá thấp gây throttle, tăng latency (nhiều team chỉ đặt memory limit). Cấu hình `behavior.scaleDown.stabilizationWindowSeconds` để tránh scale lên xuống liên tục (flapping).

## Namespace dùng để làm gì? Quản lý tài nguyên và phân quyền theo namespace thế nào? [mid]
**Namespace** chia cluster thành các vùng logic: theo team, môi trường (dev/staging), hoặc ứng dụng. Tên resource chỉ cần duy nhất trong namespace.

Công cụ đi kèm:
- **ResourceQuota**: giới hạn tổng CPU/memory/số pod của namespace.
- **LimitRange**: requests/limits mặc định cho container không khai báo.
- **RBAC**: `Role` + `RoleBinding` (phạm vi namespace), `ClusterRole` + `ClusterRoleBinding` (toàn cluster); ServiceAccount cho pod.
- **NetworkPolicy**: mặc định mọi pod gọi được nhau — cần policy để giới hạn traffic giữa các namespace/pod.

```bash
kubectl create namespace hrm-staging
kubectl get pods -n hrm-staging
kubectl config set-context --current --namespace=hrm-staging
kubectl auth can-i delete pods -n hrm-staging --as dev-user
```

Một số resource không thuộc namespace: Node, PersistentVolume, StorageClass, ClusterRole, Namespace.

**Lưu ý / bẫy thường gặp:** namespace **không phải ranh giới bảo mật mạnh** — các namespace vẫn chung node, chung kernel. Multi-tenant với yêu cầu cô lập cao nên tách cluster hoặc dùng node pool riêng + policy chặt.

## Helm là gì? Chart, values, release? [mid]
**Helm** là package manager cho Kubernetes: đóng gói nhiều manifest thành **chart** có thể tham số hóa, version hóa, cài đặt và rollback.

- **Chart**: gói gồm `Chart.yaml`, `values.yaml`, thư mục `templates/` (Go template).
- **Values**: tham số cấu hình, ghi đè theo môi trường (`values-prod.yaml`, `--set`).
- **Release**: một lần cài đặt chart vào cluster; mỗi lần upgrade tạo **revision** mới.
- **Repository**: nơi lưu chart (Artifact Hub, OCI registry).

```bash
helm create hrm-api
helm upgrade --install hrm-api ./hrm-api -n hrm \
  -f values-prod.yaml --set image.tag=1.4.2 --atomic --wait
helm history hrm-api -n hrm
helm rollback hrm-api 3 -n hrm
helm template ./hrm-api -f values-prod.yaml   # render để review
```

```yaml
# templates/deployment.yaml (trích)
image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
replicas: {{ .Values.replicaCount }}
```

Thay thế/bổ trợ: **Kustomize** (overlay không template, tích hợp `kubectl -k`), **GitOps** với Argo CD / Flux (Git là nguồn sự thật, controller tự đồng bộ cluster).

**Lưu ý / bẫy thường gặp:** template quá phức tạp khó đọc và debug; luôn `helm template`/`helm diff` trước khi upgrade production, dùng `--atomic` để tự rollback khi lỗi.

## Pod bị CrashLoopBackOff, Pending hoặc ImagePullBackOff, bạn debug thế nào? [senior]
Quy trình chung:
```bash
kubectl get pods -n hrm -o wide
kubectl describe pod <pod> -n hrm          # xem Events ở cuối
kubectl logs <pod> -n hrm --previous       # log của lần chạy bị crash
kubectl get events -n hrm --sort-by=.lastTimestamp
kubectl exec -it <pod> -- sh               # hoặc: kubectl debug -it <pod> --image=busybox
kubectl top pod -n hrm
```

| Trạng thái | Nguyên nhân thường gặp |
|---|---|
| **Pending** | Không đủ CPU/RAM theo requests, nodeSelector/affinity/taint không khớp, PVC chưa bind |
| **ImagePullBackOff / ErrImagePull** | Sai tên/tag image, registry private thiếu `imagePullSecrets`, giới hạn rate pull |
| **CrashLoopBackOff** | App lỗi khi khởi động (thiếu config/secret, không kết nối được DB), sai command, liveness probe kill quá sớm |
| **OOMKilled** (exit code 137) | Vượt memory limit, memory leak |
| **CreateContainerConfigError** | Tham chiếu ConfigMap/Secret không tồn tại |
| Running nhưng không nhận traffic | Readiness fail, selector Service không khớp, NetworkPolicy chặn |

**Lưu ý / bẫy thường gặp:** exit code giúp chẩn đoán nhanh: `1` lỗi ứng dụng, `137` bị SIGKILL (thường do OOM), `143` nhận SIGTERM. Nhớ dùng `--previous` vì log của container hiện tại thường trống khi nó vừa restart.

# Linux và Nginx

## Những lệnh Linux nào thường dùng để vận hành và troubleshoot? [junior]
| Nhóm | Lệnh |
|---|---|
| File | `ls -la`, `cd`, `cp`, `mv`, `rm -rf`, `find / -name "*.log" -mtime +7`, `tail -f`, `less`, `grep -rn "ERROR"` |
| Quyền | `chmod 640 file`, `chown app:app file`, `sudo` |
| Process | `ps aux`, `top`/`htop`, `kill -15 <pid>` (graceful), `kill -9` (cưỡng bức), `pgrep` |
| Tài nguyên | `free -h`, `df -h`, `du -sh *`, `iostat`, `vmstat`, `uptime` (load average) |
| Mạng | `ss -tulnp` (port đang listen), `curl -v`, `ping`, `traceroute`, `dig`/`nslookup`, `ip a`, `telnet`/`nc -zv host 5432` |
| Service & log | `systemctl status/restart nginx`, `journalctl -u nginx -f`, `/var/log/` |
| Xử lý text | `awk`, `sed`, `sort`, `uniq -c`, `wc -l`, `cut`, `xargs` |

```bash
# Top 10 IP gọi nhiều nhất trong access log
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head
# Ai đang chiếm port 8080
sudo ss -ltnp | grep 8080
```

Quyền `rwx` = 4/2/1: `chmod 755` → owner rwx, group r-x, others r-x.

**Lưu ý / bẫy thường gặp:** dùng `kill -9` ngay lập tức khiến ứng dụng không kịp dọn dẹp (đóng kết nối, flush dữ liệu) — luôn thử `SIGTERM` trước.

## Server bị chậm, CPU cao hoặc đầy ổ đĩa, bạn xử lý thế nào? [mid]
**Tiếp cận theo phương pháp USE** (Utilization, Saturation, Errors) cho CPU, memory, disk, network.

**CPU cao:**
- `top`/`htop` → process nào; `uptime` xem load average so với số core (`nproc`).
- Phân biệt `us` (code ứng dụng), `sy` (kernel), `wa` (chờ I/O — thực ra là vấn đề disk).
- Đi sâu: thread dump, `dotnet-trace`/`dotnet-counters`, `perf`, profiler.

**Memory:**
- `free -h` (nhìn cột `available`, không phải `free` — Linux dùng RAM trống làm page cache).
- `dmesg | grep -i oom` xem OOM killer đã kill process nào.

**Đầy ổ đĩa:**
```bash
df -h                                   # phân vùng nào đầy
df -i                                   # hết inode (nhiều file nhỏ)
sudo du -xh / --max-depth=1 | sort -rh | head
sudo lsof +L1                           # file đã xóa nhưng process vẫn giữ handle
docker system df; docker system prune   # image/container/log docker cũ
```
Khắc phục: cấu hình **logrotate**, giới hạn log driver Docker (`max-size`), dọn artifact cũ, mở rộng disk.

**Lưu ý / bẫy thường gặp:** xóa file log đang được ghi (`rm`) **không giải phóng dung lượng** cho đến khi process đóng file — dùng `truncate -s 0 file` hoặc restart process. Luôn ghi lại timeline và nguyên nhân gốc thay vì chỉ "restart cho chạy lại".

## Nginx làm reverse proxy và load balancer như thế nào? [mid]
- **Forward proxy**: đứng trước **client** (ẩn client, kiểm soát truy cập ra Internet).
- **Reverse proxy**: đứng trước **server** — nhận request rồi chuyển tới backend. Lợi ích: TLS termination, load balancing, cache, nén gzip, giới hạn rate, che giấu backend, phục vụ static file.

```nginx
upstream hrm_api {
    least_conn;                       # mặc định là round robin; còn có ip_hash
    server 10.0.0.11:8080 max_fails=3 fail_timeout=30s;
    server 10.0.0.12:8080;
    server 10.0.0.13:8080 backup;
}

server {
    listen 443 ssl http2;
    server_name hrm.example.com;
    ssl_certificate     /etc/ssl/hrm.crt;
    ssl_certificate_key /etc/ssl/hrm.key;
    client_max_body_size 20m;

    location /api/ {
        proxy_pass http://hrm_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location / {
        root /var/www/hrm;
        try_files $uri /index.html;   # SPA
    }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx   # kiểm tra cú pháp rồi reload không downtime
```

**Lưu ý / bẫy thường gặp:** lỗi **502 Bad Gateway** = backend chết/từ chối kết nối; **504 Gateway Timeout** = backend phản hồi quá chậm; **413** = vượt `client_max_body_size`. Backend phía sau proxy phải đọc header `X-Forwarded-*` (ASP.NET Core: `UseForwardedHeaders`) để biết IP thật và scheme HTTPS. WebSocket/SignalR cần thêm header `Upgrade` và `Connection`.

# Infrastructure as Code và Cloud

## Infrastructure as Code là gì? Terraform hoạt động thế nào? [mid]
**IaC** là quản lý hạ tầng (server, network, DB, DNS) bằng **code có version control** thay vì thao tác tay trên console. Lợi ích: tái lập được, review qua PR, nhất quán giữa môi trường, tự động hóa, giảm configuration drift.

**Terraform** (HashiCorp; bản fork mã nguồn mở là **OpenTofu**):
- Ngôn ngữ **HCL**, **khai báo** trạng thái mong muốn; hỗ trợ đa cloud qua **provider**.
- Quy trình: `init` → `plan` (xem khác biệt) → `apply` → (`destroy`).
- **State file** lưu ánh xạ giữa code và tài nguyên thực tế.

```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-tfstate"
    storage_account_name = "sttfstate"
    container_name       = "tfstate"
    key                  = "hrm-prod.tfstate"
  }
}

resource "azurerm_resource_group" "hrm" {
  name     = "rg-hrm-prod"
  location = "southeastasia"
}
```

Best practice với state:
- Lưu **remote backend** (S3 + DynamoDB lock / S3 native lock, Azure Storage, Terraform Cloud) có **state locking**.
- State chứa dữ liệu nhạy cảm → mã hóa, giới hạn quyền, **không commit lên Git**.
- Chia state theo môi trường/thành phần; dùng **module** để tái sử dụng.
- Chạy `plan` trong pipeline cho PR, `apply` có phê duyệt.

**Lưu ý / bẫy thường gặp:** sửa tay tài nguyên trên console gây **drift**; đổi một số thuộc tính có thể khiến Terraform **destroy rồi tạo lại** tài nguyên — luôn đọc kỹ `plan` (`-/+`), dùng `prevent_destroy` cho tài nguyên quan trọng.

## Terraform và Ansible khác nhau thế nào? [mid]
| | Terraform | Ansible |
|---|---|---|
| Mục đích chính | **Provisioning** hạ tầng (tạo VM, network, DB, cluster) | **Configuration management** (cài package, cấu hình OS, deploy app) |
| Phong cách | Khai báo (declarative) | Thủ tục theo playbook (procedural), module có tính idempotent |
| State | Có state file | Không có state, kiểm tra trạng thái lúc chạy |
| Kiến trúc | CLI gọi API của cloud | **Agentless**, kết nối qua SSH/WinRM |
| Ngôn ngữ | HCL | YAML |
| Mô hình hạ tầng | Phù hợp **immutable** (thay mới thay vì sửa) | Phù hợp **mutable** (sửa server đang chạy) |

```yaml
# Ansible playbook
- hosts: web
  become: true
  tasks:
    - name: Install nginx
      ansible.builtin.apt:
        name: nginx
        state: present
        update_cache: true
    - name: Ensure nginx running
      ansible.builtin.service:
        name: nginx
        state: started
        enabled: true
```

Thường **kết hợp**: Terraform tạo hạ tầng → Ansible cấu hình bên trong. Với container/K8s, phần cấu hình chuyển sang Dockerfile + Helm/GitOps nên Ansible ít cần hơn. Công cụ khác: Pulumi (IaC bằng ngôn ngữ lập trình), Bicep/ARM (Azure), CloudFormation/CDK (AWS), Chef, Puppet.

**Lưu ý / bẫy thường gặp:** "idempotent" là từ khóa quan trọng — chạy lại nhiều lần phải cho cùng kết quả; module `shell`/`command` trong Ansible không tự idempotent.

## Phân biệt IaaS, PaaS, SaaS (và serverless). [junior]
| Mô hình | Bạn quản lý | Nhà cung cấp quản lý | Ví dụ |
|---|---|---|---|
| **On-premise** | Tất cả | — | Datacenter riêng |
| **IaaS** | OS, runtime, ứng dụng, dữ liệu | Phần cứng, mạng, ảo hóa | AWS EC2, Azure Virtual Machines, GCP Compute Engine |
| **PaaS** | Ứng dụng, dữ liệu | Thêm OS, runtime, scaling, patching | Azure App Service, AWS Elastic Beanstalk, Azure SQL Database, Heroku |
| **SaaS** | Chỉ dữ liệu & cấu hình sử dụng | Toàn bộ | Microsoft 365, Gmail, Salesforce, Jira Cloud |
| **Serverless / FaaS** | Chỉ code hàm | Mọi thứ, scale về 0, trả theo lần chạy | AWS Lambda, Azure Functions |

Đây là **shared responsibility model**: càng lên cao, nhà cung cấp chịu trách nhiệm càng nhiều, bạn càng ít kiểm soát nhưng ra mắt nhanh hơn. Bảo mật dữ liệu và quản lý danh tính luôn là trách nhiệm của bạn.

Mô hình triển khai: public cloud, private cloud, hybrid, multi-cloud.

**Lưu ý / bẫy thường gặp:** serverless có **cold start**, giới hạn thời gian chạy và dễ phát sinh chi phí khó dự đoán khi tải cao; Kubernetes managed (AKS/EKS/GKE) nằm giữa IaaS và PaaS (thường gọi là CaaS).

## Các dịch vụ cốt lõi của AWS và Azure tương ứng với nhau thế nào? [mid]
| Nhóm | AWS | Azure |
|---|---|---|
| Máy ảo | EC2 | Virtual Machines |
| Auto scaling | Auto Scaling Group | VM Scale Sets |
| PaaS web | Elastic Beanstalk, App Runner | App Service |
| Serverless | Lambda | Functions |
| Container | ECS, EKS, Fargate | AKS, Container Apps, Container Instances |
| Registry | ECR | ACR |
| Object storage | S3 | Blob Storage |
| Block storage | EBS | Managed Disks |
| SQL managed | RDS, Aurora | Azure SQL Database, Azure Database for PostgreSQL/MySQL |
| NoSQL | DynamoDB | Cosmos DB |
| Cache | ElastiCache | Azure Cache for Redis (Azure Managed Redis) |
| Mạng | VPC, Security Group | VNet, Network Security Group |
| Load balancer | ALB (L7), NLB (L4) | Application Gateway (L7), Load Balancer (L4), Front Door |
| DNS / CDN | Route 53 / CloudFront | Azure DNS / Front Door, CDN |
| Danh tính | IAM, IAM Identity Center | Microsoft Entra ID, RBAC, Managed Identity |
| Secret | Secrets Manager, KMS | Key Vault |
| Message | SQS, SNS, EventBridge | Service Bus, Event Grid, Event Hubs |
| Monitoring | CloudWatch, X-Ray | Azure Monitor, Application Insights, Log Analytics |
| IaC | CloudFormation, CDK | ARM, Bicep |

Khái niệm nền tảng: **Region** (vùng địa lý) và **Availability Zone** (các datacenter độc lập trong region) — deploy trải trên nhiều AZ để chịu lỗi.

**Lưu ý / bẫy thường gặp:** dùng **Managed Identity / IAM Role** cho ứng dụng thay vì lưu access key; đặt **budget alert** và tag tài nguyên để kiểm soát chi phí.

# Monitoring, Logging và Observability

## Monitoring và observability khác nhau thế nào? Ba trụ cột của observability? [mid]
- **Monitoring**: theo dõi các chỉ số **đã biết trước** và cảnh báo khi vượt ngưỡng — trả lời "hệ thống có đang lỗi không?" (*known unknowns*).
- **Observability**: khả năng hiểu **trạng thái bên trong** hệ thống từ dữ liệu nó phát ra, để trả lời cả những câu hỏi chưa lường trước — "tại sao lỗi, ở đâu?" (*unknown unknowns*).

**Ba trụ cột:**
1. **Metrics**: số liệu theo thời gian, rẻ, tổng hợp tốt (CPU, request/s, latency p95, error rate).
2. **Logs**: sự kiện rời rạc, chi tiết. Nên dùng **structured logging** (JSON) có `traceId`, `userId`, `tenantId`.
3. **Traces**: hành trình một request qua nhiều service (distributed tracing) với span, giúp tìm điểm chậm.

Chuẩn mở: **OpenTelemetry** (SDK + Collector) thu thập cả ba loại, gửi tới backend bất kỳ (Prometheus, Jaeger, Tempo, Loki, Elastic, Application Insights, Datadog).

Phương pháp chọn metric:
- **RED** cho service: Rate, Errors, Duration.
- **USE** cho tài nguyên: Utilization, Saturation, Errors.
- **Four Golden Signals** (Google SRE): latency, traffic, errors, saturation.

**Lưu ý / bẫy thường gặp:** dùng latency **trung bình** che giấu vấn đề — hãy nhìn percentile (p95, p99).

## Prometheus và Grafana hoạt động thế nào? [mid]
**Prometheus:**
- Time-series DB + hệ thống thu thập theo mô hình **pull**: định kỳ scrape endpoint `/metrics` của target (service discovery với Kubernetes).
- **Exporter** cho hệ thống không tự expose metric: node_exporter, postgres_exporter, blackbox_exporter. Job ngắn hạn dùng Pushgateway.
- Kiểu metric: **Counter** (chỉ tăng), **Gauge** (lên xuống), **Histogram**, **Summary**.
- Ngôn ngữ truy vấn **PromQL**; cảnh báo qua **Alertmanager** (gom nhóm, im lặng, định tuyến tới Slack/Teams/PagerDuty).
- Lưu trữ dài hạn/HA: Thanos, Mimir, VictoriaMetrics.

```text
# Tỉ lệ lỗi 5xx trong 5 phút
sum(rate(http_requests_total{status=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m]))

# Latency p95
histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))
```

**Grafana**: công cụ trực quan hóa, tạo **dashboard** từ nhiều data source (Prometheus, Loki, Elasticsearch, SQL, Azure Monitor), cũng hỗ trợ alerting.

**Lưu ý / bẫy thường gặp:** **high cardinality** — đưa `userId`, `requestId`, URL có tham số vào label metric sẽ làm bùng nổ số time series và sập Prometheus. Alert nên dựa trên **triệu chứng ảnh hưởng người dùng** (error rate, latency) thay vì mọi chỉ số nguyên nhân, tránh alert fatigue.

## ELK stack là gì? Thiết kế hệ thống logging tập trung như thế nào? [mid]
**ELK / Elastic Stack:**
- **Elasticsearch**: lưu và tìm kiếm full-text log (inverted index).
- **Logstash**: pipeline thu thập, parse (grok), biến đổi, làm giàu log.
- **Kibana**: giao diện tìm kiếm, dashboard.
- **Beats** (Filebeat) / **Fluent Bit**: agent nhẹ trên node để ship log → thành EFK khi dùng Fluentd/Fluent Bit.

Lựa chọn khác: **Grafana Loki** (chỉ index label, rẻ hơn), OpenSearch, Graylog, Azure Log Analytics, CloudWatch Logs, Seq.

**Thiết kế tốt:**
- Ứng dụng log ra **stdout** dạng **JSON có cấu trúc**; agent thu gom (12-factor app).
- Có **correlation/trace ID** xuyên suốt các service.
- Dùng log level hợp lý (Debug tắt trên production), có thể đổi level lúc runtime.
- **Không log dữ liệu nhạy cảm** (mật khẩu, token, số CMND, lương) — masking.
- Chính sách **retention** và index lifecycle (hot → warm → cold → delete) để kiểm soát chi phí.
- Buffer (Kafka/Redis) giữa agent và Elasticsearch khi lượng log lớn.

```csharp
logger.LogInformation("Payroll calculated for {EmployeeId} in {ElapsedMs} ms", empId, sw.ElapsedMilliseconds);
```

**Lưu ý / bẫy thường gặp:** dùng string interpolation (`$"..."`) trong log làm mất tính cấu trúc — dùng message template có placeholder.

# Bảo mật, DevSecOps và SRE

## Quản lý secrets trong hệ thống và pipeline như thế nào? [mid]
**Nguyên tắc:**
- **Không bao giờ** commit secret vào Git (kể cả repo private) hay đóng gói vào image.
- Lưu tập trung trong **secret manager**: HashiCorp Vault, Azure Key Vault, AWS Secrets Manager / SSM Parameter Store, GCP Secret Manager.
- Ứng dụng truy cập bằng **danh tính** (Managed Identity, IAM Role, Kubernetes ServiceAccount + Workload Identity) thay vì thêm một secret khác.
- **Least privilege**, tách secret theo môi trường, **audit log** truy cập.
- **Rotation** định kỳ; ưu tiên **dynamic secret** ngắn hạn (Vault tạo DB credential có TTL).
- CI/CD: dùng secret store của pipeline (GitHub Secrets, Azure DevOps variable group liên kết Key Vault), **OIDC federation** tới cloud thay cho key dài hạn, mask secret trong log.

**Phát hiện rò rỉ:** gitleaks, trufflehog, GitHub secret scanning + push protection; pre-commit hook.

**Khi lộ secret:** **thu hồi và rotate ngay lập tức** là bước đầu tiên — xóa khỏi lịch sử Git (`git filter-repo`) là chưa đủ vì có thể đã bị clone/cache.

```bash
# Lấy secret từ Azure Key Vault trong script
az keyvault secret show --vault-name kv-hrm-prod --name DbPassword --query value -o tsv
```

**Lưu ý / bẫy thường gặp:** file `appsettings.Development.json` hoặc `.env` chứa mật khẩu thật bị commit là nguồn rò rỉ phổ biến nhất.

## DevSecOps là gì? Đưa bảo mật vào pipeline như thế nào? [senior]
**DevSecOps** = tích hợp bảo mật vào **mọi giai đoạn** của vòng đời phát triển (**shift left** — phát hiện sớm thì sửa rẻ), bảo mật là trách nhiệm chung chứ không phải cổng kiểm tra cuối cùng.

| Giai đoạn | Thực hành / công cụ |
|---|---|
| Plan / Design | Threat modeling (STRIDE), yêu cầu bảo mật |
| Code | IDE plugin, pre-commit, secret scanning (gitleaks), code review |
| Build | **SAST** (SonarQube, Semgrep, CodeQL), **SCA** dependency scan (Dependabot, Snyk, OWASP Dependency-Check), **SBOM** (Syft, CycloneDX) |
| Package | Quét image (Trivy, Grype), ký image (Cosign/Sigstore), base image tối giản |
| IaC | Quét cấu hình sai (Checkov, tfsec/Trivy, KICS) |
| Test | **DAST** (OWASP ZAP), test xâm nhập |
| Deploy | Policy as code (OPA Gatekeeper, Kyverno): cấm container privileged, image chưa ký, chạy root |
| Runtime | Runtime security (Falco), WAF, SIEM, patching |

Khuôn khổ tham chiếu: **OWASP Top 10**, **SLSA** (an toàn supply chain), CIS Benchmarks.

**Lưu ý / bẫy thường gặp:** bật mọi công cụ quét và chặn build với mọi cảnh báo sẽ khiến dev bỏ qua hoặc tắt chúng. Hãy bắt đầu bằng chế độ cảnh báo, chặn với mức **Critical/High**, xử lý false positive và đo thời gian khắc phục lỗ hổng.

## Giải thích SLA, SLO, SLI và error budget. [mid]
- **SLI (Service Level Indicator)**: chỉ số đo được thực tế. Vd: % request trả về thành công trong < 300ms.
- **SLO (Service Level Objective)**: **mục tiêu nội bộ** cho SLI trong một khoảng thời gian. Vd: 99.9% request thành công trong 30 ngày.
- **SLA (Service Level Agreement)**: **cam kết với khách hàng** kèm hậu quả (hoàn tiền, phạt) nếu vi phạm. SLA thường **lỏng hơn** SLO để có khoảng an toàn (SLO 99.9%, SLA 99.5%).

**Error budget** = `1 − SLO`. Với SLO 99.9%/30 ngày → được phép không đạt khoảng **43 phút** mỗi tháng.

| Availability | Downtime cho phép / năm | / tháng |
|---|---|---|
| 99% | ~3.65 ngày | ~7.2 giờ |
| 99.9% | ~8.76 giờ | ~43 phút |
| 99.99% | ~52.6 phút | ~4.3 phút |
| 99.999% | ~5.26 phút | ~26 giây |

Cách dùng error budget:
- Còn budget → được release nhanh, thử nghiệm.
- Hết budget → **đóng băng tính năng**, ưu tiên công việc reliability.
- Cảnh báo theo **burn rate** (tốc độ tiêu budget) thay vì ngưỡng tĩnh.

**Lưu ý / bẫy thường gặp:** 100% không phải mục tiêu đúng — quá đắt và chặn đổi mới; người dùng cũng không phân biệt được 99.99% và 100% vì mạng của họ còn kém tin cậy hơn. Availability của hệ thống phụ thuộc nối tiếp là **tích** các thành phần (99.9% × 99.9% ≈ 99.8%).

## SRE là gì? Khác DevOps thế nào? Toil là gì? [mid]
**SRE (Site Reliability Engineering)** do Google khởi xướng: *"what happens when you ask a software engineer to design an operations function"* — áp dụng kỹ thuật phần mềm để giải quyết bài toán vận hành.

Thực hành cốt lõi:
- Định nghĩa **SLI/SLO**, quản lý bằng **error budget**.
- Giảm **toil**: công việc vận hành thủ công, lặp lại, có thể tự động hóa, không tạo giá trị lâu dài và tăng tuyến tính theo quy mô (restart service bằng tay, cấp quyền thủ công). Google đặt mục tiêu toil < 50% thời gian của SRE.
- Monitoring/alerting dựa trên triệu chứng, on-call bền vững.
- **Blameless postmortem**, capacity planning, release engineering, chaos engineering.

| | DevOps | SRE |
|---|---|---|
| Bản chất | Văn hóa, triết lý | Một cách triển khai cụ thể có quy định rõ |
| Trọng tâm | Tốc độ giao hàng + hợp tác | Độ tin cậy được đo lường |
| Công cụ quản trị | Tự động hóa, CI/CD | SLO, error budget |

Câu nổi tiếng: *"class SRE implements interface DevOps"*.

**Lưu ý / bẫy thường gặp:** đổi tên team Ops thành "SRE" mà không có SLO, không có thời gian dành cho kỹ thuật thì vẫn chỉ là ops truyền thống.

## Quy trình xử lý sự cố (incident) trên production và viết postmortem? [senior]
**Trong lúc sự cố:**
1. **Phát hiện & phân loại**: alert hoặc báo cáo từ user; đánh giá **mức độ nghiêm trọng** (SEV1–SEV4) theo tác động.
2. **Tổ chức**: chỉ định **Incident Commander** (điều phối, ra quyết định), người xử lý kỹ thuật, người **truyền thông** (cập nhật status page, stakeholder định kỳ). Mở kênh chat/war room riêng.
3. **Giảm thiểu trước, tìm nguyên nhân gốc sau** (*mitigate first*): rollback, tắt feature flag, failover, scale out, chặn traffic xấu. Mục tiêu là giảm MTTR.
4. Ghi **timeline** song song (ai làm gì, lúc nào).
5. Xác nhận đã khôi phục qua metric, tuyên bố kết thúc.

**Sau sự cố — blameless postmortem:**
- Tóm tắt, tác động (bao nhiêu user, bao lâu, error budget tiêu tốn), timeline.
- **Root cause** và các yếu tố góp phần (5 Whys); tập trung vào **hệ thống và quy trình**, không đổ lỗi cá nhân.
- Điều gì làm tốt, điều gì chưa tốt, điểm may mắn.
- **Action items** cụ thể, có owner và deadline (thêm alert, test, guardrail, runbook, tự động hóa).
- Chia sẻ rộng rãi để cả tổ chức học hỏi.

Chỉ số liên quan: **MTTD** (phát hiện), **MTTA** (xác nhận), **MTTR** (khôi phục), **MTBF**.

**Lưu ý / bẫy thường gặp:** sai lầm phổ biến là mải debug tìm nguyên nhân trong khi có thể rollback ngay để khôi phục dịch vụ; và postmortem không có action item được theo dõi thì sự cố sẽ lặp lại.
