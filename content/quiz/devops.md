---
topic: devops
---

## Khác biệt giữa Continuous Delivery và Continuous Deployment? [junior]
- [ ] Continuous Delivery không cần chạy test tự động
- [x] Continuous Delivery luôn giữ code ở trạng thái sẵn sàng release nhưng cần bước phê duyệt thủ công để lên production; Continuous Deployment tự động deploy lên production khi pipeline pass
- [ ] Continuous Deployment chỉ deploy lên môi trường staging
- [ ] Hai khái niệm là một, chỉ khác tên gọi
> Cả hai đều build, test và đóng gói tự động; điểm khác là bước cuối lên production có cần con người bấm nút hay không. Continuous Deployment đòi hỏi bộ test và monitoring đủ tin cậy.

## `git cherry-pick <commit>` dùng để làm gì? [junior]
- [ ] Xóa một commit khỏi lịch sử
- [ ] Gộp toàn bộ một branch vào branch hiện tại
- [x] Áp dụng thay đổi của một commit cụ thể lên branch hiện tại, tạo commit mới
- [ ] Chuyển sang branch chứa commit đó
> Cherry-pick hay dùng để đưa một bản hotfix từ `main` sang branch release mà không merge cả branch. Commit mới có nội dung tương tự nhưng hash khác commit gốc.

## Khác biệt giữa `git fetch` và `git pull`? [junior]
- [x] `git fetch` chỉ tải commit mới từ remote về remote-tracking branch; `git pull` = fetch rồi merge (hoặc rebase) vào branch hiện tại
- [ ] `git fetch` đẩy commit lên remote, `git pull` tải về
- [ ] `git pull` không thay đổi working directory
- [ ] `git fetch` tự động giải quyết conflict
> `fetch` an toàn vì không động vào branch local, cho phép xem trước bằng `git log HEAD..origin/main`. `pull` có thể gây merge commit hoặc conflict vì có bước tích hợp.

## Phát biểu nào đúng về Docker image và container? [junior]
- [ ] Container là file template, image là tiến trình đang chạy
- [ ] Mỗi image chỉ tạo được một container
- [ ] Sửa file trong container sẽ thay đổi image gốc
- [x] Image là template read-only gồm các layer; container là một instance đang chạy của image với một writable layer riêng
> Từ một image có thể chạy nhiều container độc lập. Thay đổi trong container nằm ở writable layer và mất khi container bị xóa (trừ khi dùng volume hoặc `docker commit`).

## Lệnh nào liệt kê tất cả container, kể cả container đã dừng? [junior]
- [ ] `docker ps`
- [ ] `docker images`
- [x] `docker ps -a`
- [ ] `docker container inspect`
> `docker ps` mặc định chỉ hiện container đang chạy; thêm `-a` để thấy cả container đã exit. `docker images` liệt kê image chứ không phải container.

## Điểm khác biệt cốt lõi giữa container và virtual machine? [junior]
- [ ] Container luôn bảo mật hơn VM
- [x] Container dùng chung kernel của host OS và cô lập bằng namespace/cgroup; VM chạy guest OS riêng trên hypervisor
- [ ] VM khởi động nhanh hơn container
- [ ] Container không thể giới hạn CPU và memory
> Vì dùng chung kernel, container nhẹ và khởi động trong vài giây, nhưng mức cô lập yếu hơn VM. cgroups cho phép giới hạn CPU/memory cho container.

## Trong Kubernetes, đơn vị nhỏ nhất có thể deploy và quản lý là gì? [junior]
- [x] Pod
- [ ] Container
- [ ] Node
- [ ] Deployment
> Pod chứa một hoặc nhiều container dùng chung network namespace (cùng IP) và volume. Kubernetes không schedule container lẻ, còn Deployment là controller quản lý các Pod qua ReplicaSet.

## `chmod 755 deploy.sh` đặt quyền gì cho file? [junior]
- [ ] Owner: rw-, group: r--, others: r--
- [ ] Mọi người đều có quyền rwx
- [ ] Owner: rwx, group: rwx, others: r-x
- [x] Owner: rwx, group: r-x, others: r-x
> Mỗi chữ số là tổng r=4, w=2, x=1: 7 = rwx, 5 = r-x. Đây là quyền phổ biến cho script cần thực thi nhưng chỉ owner được sửa.

## Ứng dụng báo lỗi "address already in use" ở port 8080. Lệnh nào giúp tìm tiến trình đang chiếm port đó trên Linux? [junior]
- [ ] `chmod 8080`
- [x] `ss -tlnp | grep 8080` (hoặc `lsof -i :8080`)
- [ ] `df -h`
- [ ] `tail -f /var/log/syslog`
> `ss -tlnp` liệt kê socket TCP đang listen kèm PID/tên tiến trình (cần sudo để thấy tiến trình của user khác). `df -h` xem dung lượng ổ đĩa, không liên quan đến port.

## Đang code dở dang thì cần chuyển branch để sửa bug gấp, nhưng chưa muốn commit. Lệnh nào phù hợp? [junior]
- [ ] `git reset --hard`
- [ ] `git revert HEAD`
- [ ] `git clean -fd`
- [x] `git stash` (sau đó `git stash pop` để lấy lại)
> `git stash` cất tạm các thay đổi chưa commit và đưa working directory về sạch. `reset --hard` và `clean -fd` sẽ xóa mất thay đổi.

## Vai trò của Nginx khi được dùng làm reverse proxy? [junior]
- [ ] Thay mặt client gửi request ra Internet để ẩn IP người dùng
- [ ] Biên dịch source code backend
- [x] Nhận request từ client và chuyển tiếp đến backend server, thường kèm TLS termination, load balancing, caching
- [ ] Thay thế hoàn toàn database
> Reverse proxy đứng trước server, client chỉ thấy Nginx. Phương án đầu mô tả forward proxy, loại proxy đứng phía client.

## File `.dockerignore` dùng để làm gì? [junior]
- [ ] Liệt kê các container không được khởi động
- [x] Loại các file/thư mục (vd. `node_modules`, `.git`, `.env`) khỏi build context gửi tới Docker daemon
- [ ] Bỏ qua lỗi khi build image
- [ ] Liệt kê các port không được expose
> Build context nhỏ giúp build nhanh hơn, tránh làm hỏng cache khi file không liên quan thay đổi và tránh đưa nhầm secret vào image.

## Phát biểu nào đúng về `git rebase` so với `git merge`? [mid]
- [ ] Rebase giữ nguyên hash của các commit được rebase
- [ ] Merge luôn tạo lịch sử tuyến tính
- [ ] Rebase an toàn trên branch đã push và người khác đang dùng chung
- [x] Rebase viết lại commit (tạo hash mới) để có lịch sử tuyến tính; không nên rebase branch đã chia sẻ
> Rebase replay từng commit lên base mới nên hash thay đổi; nếu người khác đã dựa trên commit cũ, lịch sử sẽ bị phân nhánh và phải force push. Merge giữ nguyên lịch sử và tạo merge commit (trừ khi fast-forward).

## Bạn vừa commit nhầm (chưa push) và muốn bỏ commit đó nhưng giữ nguyên các thay đổi ở trạng thái staged. Lệnh nào phù hợp? [mid]
- [x] `git reset --soft HEAD~1`
- [ ] `git reset --hard HEAD~1`
- [ ] `git reset --mixed HEAD~1`
- [ ] `git revert HEAD`
> `--soft` chỉ di chuyển HEAD, giữ index và working tree; `--mixed` (mặc định) giữ thay đổi nhưng unstage; `--hard` xóa luôn thay đổi. `revert` tạo commit mới đảo ngược thay đổi chứ không bỏ commit cũ.

## Một commit lỗi đã được push lên `main` và cả team đã pull. Cách hoàn tác an toàn nhất? [mid]
- [ ] `git reset --hard HEAD~1` rồi `git push --force`
- [x] `git revert <commit>` rồi push
- [ ] `git commit --amend` rồi push
- [ ] Xóa branch `main` và tạo lại
> `revert` tạo commit mới đảo ngược thay đổi, không viết lại lịch sử nên không ảnh hưởng người đã pull. Reset + force push làm lệch lịch sử của mọi người và thường bị chặn bởi branch protection.

## Dockerfile Node.js nào tận dụng build cache tốt nhất khi chỉ sửa source code? [mid]
```dockerfile
# Phương án A
COPY . .
RUN npm ci

# Phương án B
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
```
- [ ] A, vì ít lệnh COPY hơn
- [ ] Hai phương án như nhau vì Docker cache theo lệnh
- [x] B, vì layer `npm ci` chỉ bị build lại khi file package thay đổi
- [ ] A, vì `npm ci` luôn được cache bất kể file nào thay đổi
> Docker invalidate cache từ layer đầu tiên có input thay đổi trở đi. Ở A, sửa bất kỳ file nào cũng làm `COPY . .` đổi và phải cài lại toàn bộ dependency.

## Image có `ENTRYPOINT ["python", "app.py"]` và `CMD ["--port", "8000"]`. Chạy `docker run myimg --port 9000` thì lệnh thực thi là gì? [mid]
- [ ] `python app.py --port 8000`
- [x] `python app.py --port 9000`
- [ ] `--port 9000`
- [ ] `python app.py --port 8000 --port 9000`
> Tham số sau tên image ghi đè `CMD`, còn `ENTRYPOINT` được giữ và nhận `CMD` làm argument. Muốn ghi đè ENTRYPOINT phải dùng `--entrypoint`.

## Lợi ích chính của multi-stage build? [mid]
- [ ] Cho phép chạy nhiều container từ một Dockerfile
- [ ] Tự động build image cho nhiều kiến trúc CPU
- [ ] Giúp container khởi động nhiều tiến trình song song
- [x] Tách stage build (SDK, compiler) khỏi stage runtime, chỉ copy artifact cần thiết nên image cuối nhỏ và ít bề mặt tấn công
> Ví dụ build bằng `dotnet/sdk` rồi `COPY --from=build` sang `dotnet/aspnet`. Build đa kiến trúc là việc của `docker buildx --platform`, không phải multi-stage.

## Chạy PostgreSQL bằng `docker run -v pgdata:/var/lib/postgresql/data postgres`, sau đó `docker rm -f` container và chạy lại với cùng `-v pgdata:...`. Dữ liệu thế nào? [mid]
- [x] Dữ liệu vẫn còn vì named volume `pgdata` tồn tại độc lập với vòng đời container
- [ ] Mất hết, vì xóa container sẽ xóa mọi volume
- [ ] Mất hết, vì volume chỉ tồn tại trong RAM
- [ ] Còn dữ liệu nhưng ở chế độ read-only
> Named volume chỉ bị xóa khi chạy `docker volume rm` hoặc `docker volume prune`; `docker rm -v` chỉ xóa anonymous volume. Không dùng volume thì dữ liệu nằm trong writable layer và mất cùng container.

## Kubernetes Service loại `NodePort` hoạt động thế nào? [mid]
- [ ] Chỉ truy cập được từ bên trong cluster qua virtual IP
- [ ] Tự động tạo load balancer của cloud provider và không mở port nào trên node
- [x] Mở một port (mặc định dải 30000–32767) trên mọi node, traffic tới `<NodeIP>:<NodePort>` được chuyển đến các Pod
- [ ] Ánh xạ Service tới một tên DNS bên ngoài
> Phương án đầu là ClusterIP, thứ tư là ExternalName. LoadBalancer thực chất được xây dựng trên NodePort + ClusterIP và thêm load balancer từ cloud.

## Khi readiness probe của một Pod bị fail liên tục, điều gì xảy ra? [mid]
- [ ] Kubelet restart container ngay lập tức
- [ ] Pod bị xóa và tạo lại trên node khác
- [ ] Deployment tự động rollback về revision trước
- [x] Pod bị gỡ khỏi endpoints của Service nên không nhận traffic, nhưng container không bị restart
> Readiness quyết định Pod có nhận traffic hay không; liveness fail mới khiến kubelet restart container. Deployment không tự rollback, rollout chỉ bị dừng lại vì Pod mới không Ready.

## Phát biểu nào đúng về Kubernetes Secret mặc định? [mid]
- [ ] Dữ liệu được mã hóa bằng AES nên commit lên Git là an toàn
- [x] Dữ liệu chỉ được encode base64, không mã hóa; cần bật encryption at rest cho etcd và RBAC chặt chẽ
- [ ] Secret không thể mount thành file trong Pod
- [ ] Secret và ConfigMap không có khác biệt nào
> Base64 là encoding, ai đọc được object là decode được. Trong thực tế nên kết hợp EncryptionConfiguration, RBAC, và công cụ như Sealed Secrets, External Secrets hoặc Vault.

## Khác biệt chính giữa blue-green và canary deployment? [mid]
- [ ] Blue-green chuyển traffic từ từ theo phần trăm, canary chuyển toàn bộ một lần
- [ ] Canary cần gấp đôi hạ tầng, blue-green thì không
- [ ] Blue-green không hỗ trợ rollback
- [x] Blue-green chạy song song hai môi trường và chuyển toàn bộ traffic một lần (rollback bằng cách chuyển lại); canary đưa phiên bản mới cho một phần nhỏ traffic rồi tăng dần
> Blue-green rollback nhanh nhưng tốn gấp đôi tài nguyên trong lúc chuyển đổi. Canary giới hạn phạm vi ảnh hưởng (blast radius) và cần metrics tốt để quyết định tăng tiếp hay rollback.

## Với cấu hình Nginx sau, request `GET /api/users` được chuyển đến backend với path nào? [mid]
```nginx
location /api/ {
    proxy_pass http://backend:5000/;
}
```
- [ ] `/api/users`
- [x] `/users`
- [ ] `/api/api/users`
- [ ] `/`
> Khi `proxy_pass` có URI (ở đây là `/`), phần khớp với location (`/api/`) được thay bằng URI đó. Nếu viết `proxy_pass http://backend:5000;` (không có `/`), path gốc `/api/users` được giữ nguyên.

## Dockerfile dùng `CMD node server.js` (shell form). Khi `docker stop` hoặc Kubernetes xóa Pod, ứng dụng không graceful shutdown mà bị kill sau vài chục giây. Nguyên nhân khả dĩ nhất? [senior]
- [ ] Node.js không hỗ trợ xử lý SIGTERM
- [x] Shell form chạy qua `/bin/sh -c` nên shell là PID 1 và không chuyển tiếp SIGTERM cho tiến trình node; hết grace period thì bị SIGKILL
- [ ] `docker stop` luôn gửi SIGKILL ngay lập tức
- [ ] Do thiếu lệnh `EXPOSE` trong Dockerfile
> Nên dùng exec form `CMD ["node", "server.js"]` hoặc init nhẹ như `tini`/`--init` để tín hiệu đến đúng tiến trình. `docker stop` gửi SIGTERM trước, chờ 10 giây (Kubernetes mặc định 30 giây) rồi mới SIGKILL.

## Liveness probe của service gọi `/health`, endpoint này kiểm tra cả kết nối database. Database bị chậm 2 phút. Hậu quả có thể xảy ra là gì? [senior]
- [ ] Không ảnh hưởng gì vì Kubernetes biết lỗi nằm ở database
- [ ] Kubernetes tự động scale database lên
- [x] Toàn bộ Pod bị restart liên tục (cascading restart), làm sự cố nặng hơn trong khi restart không giúp được gì
- [ ] Pod bị chuyển sang trạng thái Pending
> Liveness chỉ nên kiểm tra bản thân tiến trình có bị treo hay không; phụ thuộc bên ngoài nên để readiness (hoặc degrade gracefully). Restart hàng loạt còn gây thundering herd khi các Pod cùng kết nối lại database.

## `kubectl get hpa` hiển thị TARGETS là `<unknown>/70%` cho HPA dựa trên CPU. Nguyên nhân thường gặp nhất? [senior]
- [ ] `maxReplicas` đặt quá nhỏ
- [ ] Deployment đang dùng strategy Recreate
- [ ] Service chưa có type LoadBalancer
- [x] metrics-server chưa được cài/không hoạt động, hoặc container không khai báo `resources.requests.cpu`
> HPA tính CPU utilization theo phần trăm của request, nên thiếu request thì không tính được. `maxReplicas` chỉ giới hạn số Pod chứ không làm metric thành unknown.

## Deployment có 3 replicas với `rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }`. Quá trình rollout diễn ra thế nào? [senior]
- [x] Tạo thêm 1 Pod mới (tối đa 4 Pod), chỉ xóa 1 Pod cũ khi Pod mới Ready, lặp lại; luôn có ít nhất 3 Pod sẵn sàng
- [ ] Xóa 1 Pod cũ trước rồi tạo Pod mới, số Pod sẵn sàng có lúc còn 2
- [ ] Xóa toàn bộ Pod cũ rồi tạo 3 Pod mới
- [ ] Tạo 3 Pod mới cùng lúc rồi xóa 3 Pod cũ
> `maxUnavailable: 0` cấm giảm dưới số replica mong muốn, `maxSurge: 1` cho phép vượt 1 Pod. Cấu hình này an toàn về capacity nhưng rollout chậm hơn và cần đủ tài nguyên cho Pod thừa.

## Cần đổi tên cột `fullname` thành `display_name` trong khi deploy kiểu rolling update (phiên bản cũ và mới chạy song song một lúc). Cách làm đúng? [senior]
- [ ] Chạy `RENAME COLUMN` trong migration rồi deploy code mới ngay
- [ ] Deploy code mới trước, đổi tên cột sau
- [x] Expand/contract: thêm cột mới, ghi cả hai cột và backfill, chuyển code sang đọc cột mới, rồi mới xóa cột cũ ở lần deploy sau
- [ ] Bật maintenance mode để dừng toàn bộ hệ thống mỗi lần thay đổi schema
> Trong lúc rolling, Pod cũ vẫn đọc `fullname` nên rename trực tiếp sẽ làm lỗi phiên bản cũ. Expand/contract giữ schema tương thích ngược ở mọi thời điểm, đồng thời cho phép rollback code.

## SLO availability 99.9% trong cửa sổ 30 ngày. Error budget tương ứng là khoảng bao nhiêu thời gian downtime? [senior]
- [ ] Khoảng 4.3 phút
- [ ] Khoảng 8.76 giờ
- [x] Khoảng 43.2 phút
- [ ] Khoảng 7.2 giờ
> 30 × 24 × 60 = 43.200 phút, 0.1% của nó là 43.2 phút. 8.76 giờ là error budget 99.9% tính cho cả năm, còn 4.3 phút ứng với 99.99% trong 30 ngày.

## Team dùng Terraform với state file local, nhiều người cùng chạy `terraform apply`. Vấn đề và giải pháp đúng? [senior]
- [ ] Không có vấn đề, Terraform luôn đọc trạng thái thực từ cloud nên không cần state
- [ ] Commit `terraform.tfstate` lên Git là đủ để đồng bộ an toàn
- [ ] Nên xóa state sau mỗi lần apply để tránh xung đột
- [x] State dễ bị ghi đè/lệch khi apply đồng thời; dùng remote backend có state locking (vd. S3 + lock, Azure Blob, Terraform Cloud) và hạn chế quyền truy cập vì state có thể chứa secret dạng plaintext
> Terraform dựa vào state để ánh xạ resource trong code với resource thật; mất state có thể khiến nó tạo trùng resource. Commit state lên Git không có locking và làm lộ secret.

## Lỡ chạy `git reset --hard HEAD~3` trên branch local, mất 3 commit chưa push. Cách khôi phục? [senior]
- [ ] Không thể khôi phục vì commit đã bị xóa vĩnh viễn
- [ ] `git revert HEAD~3`
- [x] Dùng `git reflog` tìm hash trước khi reset rồi `git reset --hard <hash>` (hoặc tạo branch từ hash đó)
- [ ] `git stash pop`
> Reflog ghi lại mọi vị trí HEAD từng trỏ tới; commit "mất" vẫn còn trong object database cho đến khi bị garbage collect (mặc định reflog entry giữ khoảng 90 ngày, entry không còn reachable khoảng 30 ngày). Stash không liên quan vì các commit không được stash.

## Container trong Kubernetes vượt quá `resources.limits`. Phát biểu nào đúng? [senior]
- [ ] Vượt CPU limit sẽ bị OOMKilled, vượt memory limit chỉ bị chậm lại
- [x] Vượt CPU limit bị throttle (chậm lại), vượt memory limit bị OOMKilled
- [ ] Cả hai trường hợp đều bị restart ngay
- [ ] Không có gì xảy ra vì limits chỉ dùng cho scheduling
> CPU là tài nguyên có thể nén (compressible) nên kernel giới hạn qua CFS quota; memory không nén được nên kernel kill tiến trình. Scheduling dựa trên requests chứ không phải limits.

## Playbook Ansible có task `shell: apt-get install -y nginx`. Vấn đề chính so với dùng module `apt: name=nginx state=present`? [senior]
- [ ] Module `shell` không chạy được trên Ubuntu
- [ ] Ansible cần cài agent trên server để chạy `shell`
- [ ] Module `apt` luôn cài lại package mỗi lần chạy
- [x] `shell` không idempotent theo nghĩa Ansible: luôn báo `changed` và không mô tả trạng thái mong muốn; module `apt` kiểm tra trạng thái và chỉ thay đổi khi cần
> Idempotency giúp chạy lại playbook an toàn và báo cáo đúng thay đổi; nếu buộc dùng `shell`/`command` thì nên thêm `creates`, `changed_when`. Ansible là agentless, kết nối qua SSH.

## Dockerfile có `COPY id_rsa /root/.ssh/` để clone repo private, sau đó `RUN rm /root/.ssh/id_rsa`. Image đã an toàn chưa? [senior]
- [ ] An toàn, vì file đã bị xóa trước khi image hoàn tất
- [x] Chưa, key vẫn nằm trong layer của lệnh COPY và có thể trích xuất; nên dùng BuildKit `RUN --mount=type=secret` (hoặc `--mount=type=ssh`) hoặc multi-stage
- [ ] An toàn nếu image được push lên registry private
- [ ] Chỉ không an toàn khi container đang chạy
> Mỗi lệnh tạo một layer bất biến; xóa ở layer sau chỉ che file chứ không loại bỏ nó, ai `docker save` image là lấy được. Registry private chỉ giảm phạm vi lộ chứ không giải quyết vấn đề.

## Có 5 instance, mỗi instance tự tính p99 latency. Dashboard lấy trung bình 5 giá trị p99 để làm p99 toàn hệ thống. Vấn đề là gì? [senior]
- [ ] Không có vấn đề, trung bình p99 bằng p99 tổng thể
- [ ] Chỉ sai khi các instance có cùng lượng traffic
- [ ] Nên lấy p99 nhỏ nhất trong 5 instance thay vì trung bình
- [x] Percentile không cộng/trung bình được; cần gộp phân phối gốc (vd. cộng các bucket histogram rồi dùng `histogram_quantile` trong Prometheus)
> Trung bình p99 có thể sai lệch lớn, nhất là khi traffic không đều hoặc một instance có tail latency cao. Prometheus histogram cho phép `sum by (le)` các bucket trước khi tính quantile, còn summary tính sẵn quantile ở client nên không aggregate được.
