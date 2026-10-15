---
topic: message-broker
---

## Trong mô hình point-to-point queue có 3 consumer cùng lắng nghe một queue (competing consumers), một message sẽ được xử lý bởi bao nhiêu consumer? [junior]
- [ ] Cả 3 consumer, mỗi consumer nhận một bản copy
- [x] Chỉ một trong 3 consumer
- [ ] Consumer đăng ký đầu tiên, 2 consumer còn lại chỉ làm backup
- [ ] Không consumer nào xử lý cho tới khi cả 3 cùng ack
> Queue point-to-point chia message giữa các competing consumer, mỗi message chỉ đến một consumer, nhờ vậy scale ngang được. Muốn mỗi bên nhận một bản copy thì phải dùng pub/sub (fanout exchange, SNS topic, Kafka consumer group riêng).

## Exchange loại `headers` trong RabbitMQ route message dựa trên gì? [junior]
- [ ] Routing key phải khớp chính xác với binding key
- [ ] Routing key khớp theo pattern có wildcard `*` và `#`
- [ ] Hash của routing key để chia đều message giữa các queue
- [x] Các header của message so với argument của binding, với `x-match` là `all` hoặc `any`
> Headers exchange bỏ qua routing key, chỉ so header của message với argument của binding: `x-match=all` thì phải khớp hết, `any` thì khớp một là đủ. Chia theo hash là việc của plugin consistent-hash exchange, không phải headers exchange.

## Queue được bind vào topic exchange với binding key `order.*`. Routing key nào sẽ được route tới queue này? [junior]
- [ ] `order`
- [ ] `order.created.vn`
- [x] `order.created`
- [ ] `orders.created`
> `*` khớp đúng MỘT từ, còn `#` khớp từ 0 từ trở lên (các từ ngăn bằng dấu chấm). Vì vậy `order.#` khớp cả `order`, `order.created` lẫn `order.created.vn`, còn `order.*` chỉ khớp `order.created`.

## Consumer RabbitMQ dùng `autoAck=true` và bị crash khi đang xử lý message. Điều gì xảy ra với message đó? [junior]
- [x] Message bị mất, vì broker coi là đã giao thành công ngay khi gửi đi
- [ ] Message tự động requeue khi connection bị đóng
- [ ] Message được chuyển vào dead-letter exchange
- [ ] Broker gửi lại message sau visibility timeout
> Ở chế độ auto ack, broker xóa message ngay khi giao nên crash là mất. Chỉ message chưa ack ở chế độ manual ack mới được requeue khi channel đóng. Visibility timeout là khái niệm của SQS, không có trong RabbitMQ.

## Consumer group A đã đọc và commit offset tới 100 trên một partition Kafka. Một consumer group B mới subscribe topic đó với `auto.offset.reset=earliest`. Kết quả? [junior]
- [x] B đọc từ offset nhỏ nhất còn lại trong partition, vì message không bị xóa khi consume mà chỉ bị xóa theo retention
- [ ] B chỉ nhận message mới từ offset 101 vì A đã consume phần trước
- [ ] B không nhận được gì vì mỗi message chỉ được giao cho một consumer group
- [ ] B dùng chung offset với A nên đọc tiếp từ 101
> Kafka là log: consume không xóa message, mỗi consumer group có committed offset riêng (lưu trong `__consumer_offsets`). Message chỉ bị xóa khi hết `retention.ms`/`retention.bytes` hoặc bị compaction.

## Consumer group có 3 consumer đọc một topic chỉ có 2 partition. Điều gì xảy ra? [junior]
- [ ] Kafka chia message của 2 partition đều cho cả 3 consumer theo round-robin
- [ ] Kafka tự động tạo thêm partition thứ 3
- [x] 2 consumer mỗi cái nhận 1 partition, consumer còn lại idle
- [ ] Group bị lỗi và không consumer nào nhận được message
> Trong một group, mỗi partition chỉ được gán cho tối đa một consumer, nên consumer thừa sẽ ngồi chờ và chỉ nhận việc khi có rebalance. Kafka không bao giờ tự tạo thêm partition.

## Kafka đảm bảo thứ tự message ở phạm vi nào? [junior]
- [ ] Toàn bộ topic, bất kể có bao nhiêu partition
- [ ] Theo thời điểm broker nhận, trên toàn cluster
- [ ] Không có đảm bảo thứ tự nào
- [x] Chỉ trong phạm vi một partition
> Offset tăng dần trong từng partition nên thứ tự chỉ được đảm bảo trong một partition. Muốn có thứ tự toàn topic thì phải dùng 1 partition, đổi lại mất khả năng xử lý song song.

## Consumer SQS gọi `ReceiveMessage` với `WaitTimeSeconds=20`. Tác dụng của tham số này là gì? [junior]
- [ ] Message bị ẩn với các consumer khác trong 20 giây sau khi được nhận
- [x] Nếu queue rỗng, request chờ tối đa 20 giây và trả về ngay khi có message (long polling), giúp giảm số response rỗng và chi phí
- [ ] Message bị giữ lại trong queue ít nhất 20 giây rồi mới được giao
- [ ] Consumer phải xóa message trong vòng 20 giây, nếu không message sẽ vào DLQ
> Đây là long polling, tối đa 20 giây. Đáp án ẩn message là visibility timeout, còn đáp án giữ message trước khi giao là `DelaySeconds` (delay queue).

## Khác biệt đúng giữa SQS Standard và SQS FIFO? [junior]
- [x] Standard là at-least-once, thứ tự best-effort, có thể trùng; FIFO giữ thứ tự trong cùng `MessageGroupId` và dedup trong cửa sổ 5 phút
- [ ] Standard đảm bảo exactly-once, còn FIFO là at-least-once
- [ ] FIFO giữ thứ tự toàn queue bất kể `MessageGroupId` và throughput không giới hạn
- [ ] Hai loại chỉ khác nhau về giá, semantics giống nhau
> FIFO chỉ giữ thứ tự trong từng message group (các group khác nhau xử lý song song) và có throughput giới hạn hơn Standard. Standard có throughput gần như không giới hạn nhưng có thể trùng hoặc lệch thứ tự.

## Kafka consumer nhận message theo mô hình nào, và lợi ích chính của mô hình đó là gì? [junior]
- [ ] Push: broker đẩy message ngay khi có, consumer không cần poll
- [ ] Push có flow control theo credit, giống prefetch của AMQP
- [x] Pull: consumer gọi `poll()` theo tốc độ của mình, tự chủ batch và không bị broker đẩy tới quá tải
- [ ] Pull, nhưng broker xóa message ngay khi consumer đã pull
> Kafka dùng pull, consumer tự quyết định tốc độ và vị trí đọc (có thể seek để replay). RabbitMQ `basic.consume` mới là push, dùng prefetch để giới hạn số message chưa ack.

## Một subscriber Redis Pub/Sub bị mất kết nối 30 giây rồi kết nối lại. Message publish trong 30 giây đó thì sao? [junior]
- [ ] Redis giữ message trong buffer và gửi lại khi subscriber kết nối lại
- [ ] Message được ghi vào AOF và replay cho subscriber
- [ ] Publisher nhận lỗi vì lúc đó không có subscriber nào
- [x] Subscriber đó mất các message này, vì Pub/Sub là fire-and-forget và không lưu trữ
> Redis Pub/Sub không lưu message: `PUBLISH` chỉ trả về số subscriber đã nhận (có thể là 0), không báo lỗi. Cần lưu bền và đọc lại thì dùng Redis Streams.

## Event `OrderPlaced` cần được 3 service (Billing, Shipping, Email) xử lý độc lập, mỗi service có retry và tốc độ riêng. Thiết kế phù hợp trên AWS? [junior]
- [x] Publish lên một SNS topic, mỗi service có SQS queue riêng subscribe vào topic đó
- [ ] Cả 3 service cùng poll một SQS queue chung
- [ ] Ghi vào một SQS FIFO queue với 3 `MessageGroupId` khác nhau
- [ ] Producer gọi lần lượt 3 Lambda của từng service
> SNS fan-out sang nhiều SQS: mỗi queue nhận một bản copy, có buffer, retry và DLQ riêng. Nếu 3 service poll chung một queue thì chúng thành competing consumers, mỗi service chỉ nhận được một phần message.

## Broker cấu hình at-least-once delivery. Hệ quả mà consumer phải xử lý là gì? [junior]
- [ ] Message có thể mất nhưng không bao giờ bị trùng
- [x] Message không mất (nếu cấu hình đúng) nhưng có thể đến nhiều lần, nên consumer phải idempotent
- [ ] Broker đảm bảo mỗi message được xử lý đúng một lần
- [ ] Message luôn đến đúng thứ tự đã gửi
> At-least-once có redelivery (sau crash, timeout hoặc requeue) nên duplicate là chuyện bình thường. "Mất nhưng không trùng" là at-most-once, còn at-least-once không hứa gì về thứ tự.

## Khi làm request-reply qua message broker, `reply-to` và `correlation id` dùng để làm gì? [junior]
- [ ] Để broker ưu tiên giao message reply trước các message khác
- [ ] Để broker mã hóa nội dung reply
- [x] `reply-to` chỉ queue sẽ nhận phản hồi, `correlation id` giúp requester ghép reply với đúng request đang chờ
- [ ] Để broker tự loại bỏ request bị trùng
> Requester có thể gửi nhiều request đồng thời và nhận reply trên cùng một queue, nên cần correlation id để biết reply thuộc request nào. Broker không dùng correlation id để dedup hay ưu tiên.

## Azure Service Bus nhận message ở chế độ PeekLock. Consumer crash trước khi gọi `Complete`. Điều gì xảy ra? [junior]
- [ ] Message bị xóa vì đã được nhận
- [ ] Message lập tức chuyển vào dead-letter queue
- [ ] Message bị khóa vĩnh viễn cho tới khi admin mở khóa
- [x] Lock hết hạn, message hiện lại cho receiver khác và `DeliveryCount` tăng; vượt `MaxDeliveryCount` (mặc định 10) thì vào dead-letter queue
> PeekLock khóa message trong thời gian lock duration và chỉ xóa khi `Complete`. Đáp án "bị xóa ngay khi nhận" là hành vi của chế độ ReceiveAndDelete.

## Queue RabbitMQ có 2 consumer, một nhanh một chậm. Với prefetch không giới hạn, consumer chậm ôm hàng nghìn message chưa ack. Đặt `basic.qos(prefetch_count=1)` có tác dụng gì? [mid]
- [x] Mỗi consumer chỉ giữ tối đa 1 message chưa ack, broker giao message tiếp theo cho consumer đang rảnh, nên tải chia đều hơn nhưng throughput giảm do thêm round-trip
- [ ] Broker chỉ gửi 1 message mỗi giây cho mỗi consumer
- [ ] Queue chỉ chứa tối đa 1 message
- [ ] Chỉ duy nhất 1 consumer trong queue được nhận message (single active consumer)
> Prefetch giới hạn số message chưa ack trên mỗi consumer/channel, không giới hạn tốc độ hay độ dài queue. Single active consumer là tính năng riêng, bật bằng `x-single-active-consumer`.

## Classic queue được khai báo `durable=true`, nhưng publisher gửi message với `delivery_mode=1` (transient). Broker restart. Kết quả? [mid]
- [ ] Queue và message đều còn vì queue durable
- [x] Queue còn, nhưng các message transient bị mất; cần cả message persistent (`delivery_mode=2`)
- [ ] Queue mất nhưng message vẫn còn trên disk
- [ ] Cả queue và message đều mất vì `durable` chỉ áp dụng cho exchange
> Durable chỉ giữ định nghĩa queue qua restart, còn message muốn sống sót thì phải là persistent. Ngay cả vậy, muốn chắc message đã được broker ghi nhận thì vẫn cần publisher confirms.

## Consumer gặp exception thì gọi `basic.nack(requeue=true)`. Một message bị malformed khiến CPU lên 100% và log lặp mãi một lỗi. Cách xử lý đúng? [mid]
- [ ] Tăng prefetch để message lỗi bị đẩy xuống sau các message khác
- [ ] Chuyển sang `autoAck=true` để message lỗi không quay lại nữa
- [x] Phân loại lỗi: lỗi vĩnh viễn thì `nack(requeue=false)` để vào DLX (hoặc dùng `delivery-limit` của quorum queue), lỗi tạm thời thì retry có giới hạn và có delay
- [ ] Restart consumer theo lịch để xóa trạng thái lỗi
> Requeue đưa poison message về lại queue và nó được giao lại ngay, tạo vòng lặp nóng. Chuyển sang autoAck thì hết lặp nhưng mất luôn mọi message đang xử lý khi crash.

## Queue có `x-dead-letter-exchange`. Trường hợp nào KHÔNG làm message bị dead-letter (classic queue)? [mid]
- [ ] Consumer gọi `basic.reject` hoặc `basic.nack` với `requeue=false`
- [ ] Message hết TTL (`x-message-ttl` hoặc property `expiration`)
- [ ] Queue vượt `x-max-length` với overflow mặc định `drop-head`
- [x] Consumer mất connection khi đang giữ message chưa ack
> Message chưa ack khi channel hoặc connection đóng sẽ được requeue (đánh dấu `redelivered`), không bị dead-letter. Ba trường hợp còn lại đều đẩy message sang DLX.

## Topic có key là `customerId` và 6 partition, được tăng lên 12 partition khi đang chạy. Ảnh hưởng tới ordering theo key? [mid]
- [x] Default partitioner tính `hash(key) % số partition`, nên event mới của một key có thể sang partition khác event cũ; data cũ không được di chuyển, nên trong giai đoạn chuyển thứ tự theo key có thể bị phá
- [ ] Kafka tự động phân bổ lại data cũ sang partition mới theo hash mới
- [ ] Không ảnh hưởng gì vì partitioner dùng consistent hashing
- [ ] Kafka cấm tăng partition khi topic có key
> Kafka cho tăng partition (không cho giảm), nhưng không phân bổ lại dữ liệu cũ và mapping key sang partition thay đổi. Vì vậy nên chọn số partition đủ lớn từ đầu cho topic cần ordering theo key.

## Consumer đặt `enable.auto.commit=false`, xử lý message (ghi DB) xong rồi mới `commitSync()`. Crash sau khi ghi DB nhưng trước khi commit. Semantics nhận được? [mid]
- [ ] At-most-once: message đó bị bỏ qua
- [x] At-least-once: sau restart hoặc rebalance, message được đọc lại và xử lý lần thứ hai
- [ ] Exactly-once, vì commit là đồng bộ
- [ ] Message được Kafka tự chuyển vào DLQ
> Commit sau khi xử lý cho at-least-once, commit trước khi xử lý cho at-most-once. Commit đồng bộ không làm nên exactly-once, và Kafka không có DLQ tích hợp: DLQ là do ứng dụng hoặc framework tự làm.

## Topic RF=3, `min.insync.replicas=2`, producer `acks=all`. 2 trong 3 broker chứa partition chết, ISR chỉ còn leader. Kết quả? [mid]
- [ ] Producer vẫn ghi thành công, chỉ log cảnh báo
- [ ] Producer ghi thành công vào leader, phần replicate làm bù sau
- [x] Producer nhận lỗi `NotEnoughReplicas`, consumer vẫn đọc được dữ liệu đã commit
- [ ] Partition offline hoàn toàn cho cả đọc lẫn ghi
> Với `acks=all`, leader từ chối ghi khi ISR nhỏ hơn `min.insync.replicas`, nhưng vẫn phục vụ đọc. Lưu ý `min.insync.replicas` chỉ áp dụng cho `acks=all`: producer `acks=1` vẫn ghi được và chịu rủi ro mất dữ liệu.

## Consumer poll 500 record mỗi lần, mỗi record gọi API mất khoảng 1 giây. Log liên tục báo consumer rời group, `CommitFailedException`, group rebalance liên tục. Nguyên nhân chính? [mid]
- [ ] `session.timeout.ms` quá nhỏ vì heartbeat bị chặn trong lúc xử lý
- [ ] Topic không đủ partition
- [ ] Cấu hình `auto.offset.reset` sai
- [x] Một batch xử lý mất khoảng 500 giây, vượt `max.poll.interval.ms` (mặc định 5 phút), nên consumer bị coi là chết và bị đá khỏi group
> Cách sửa là giảm `max.poll.records`, tăng `max.poll.interval.ms`, hoặc xử lý nhanh hơn. Heartbeat chạy trên background thread nên xử lý chậm không làm hết `session.timeout.ms`, cái bị vượt là poll interval.

## Topic `customer-profile` cấu hình `cleanup.policy=compact`. Phát biểu nào đúng? [mid]
- [x] Kafka giữ ít nhất message mới nhất của mỗi key; message có value null (tombstone) đánh dấu xóa key và tự bị dọn sau `delete.retention.ms`
- [ ] Kafka xóa mọi message cũ hơn `retention.ms` bất kể key
- [ ] Compaction gộp các message cùng key thành một bằng cách merge các field
- [ ] Consumer luôn chỉ thấy đúng một message cho mỗi key, kể cả ở active segment
> Compaction giữ bản mới nhất theo key, rất hợp cho changelog/state. Active segment không bị compact nên consumer vẫn có thể thấy nhiều bản của cùng key, còn xóa theo thời gian là policy `delete`.

## Dashboard cho thấy consumer lag chỉ tăng ở partition 3, các partition khác gần 0. Phân tích đúng? [mid]
- [ ] Thêm consumer vào group là giải quyết được ngay
- [x] Lag tính theo từng partition (log-end-offset trừ committed offset); khả năng cao là key bị lệch (hot key) dồn vào partition 3, hoặc consumer giữ partition 3 bị chậm hay kẹt ở một message
- [ ] Broker giữ partition 3 bị đầy disk
- [ ] Lag tính trên toàn topic nên số liệu theo từng partition không có ý nghĩa
> Mỗi partition chỉ có một consumer trong group, nên thêm consumer không chia được tải của partition 3. Cần xem phân bố key và message đang xử lý (poison message, call chậm), có thể phải đổi key hoặc xử lý song song theo key bên trong consumer.

## Consumer SQS mất khoảng 90 giây xử lý mỗi message, nhưng visibility timeout là 30 giây. Hệ thống xuất hiện duplicate và một số message xử lý thành công vẫn rơi vào DLQ. Cách sửa đúng? [mid]
- [ ] Bật long polling
- [ ] Chuyển sang FIFO queue để chống duplicate
- [ ] Giảm `maxReceiveCount` của redrive policy xuống 1
- [x] Đặt visibility timeout lớn hơn thời gian xử lý (hoặc gia hạn bằng `ChangeMessageVisibility` khi đang xử lý) và chỉ `DeleteMessage` sau khi xong
> Sau 30 giây message hiện lại, bị consumer khác nhận nên receive count tăng và chạm `maxReceiveCount`, rồi bị đẩy vào DLQ. Dedup của FIFO chỉ chặn trùng ở phía gửi, không ngăn được redelivery khi visibility timeout hết.

## Trên Azure Service Bus, các event của cùng một `OrderId` phải được xử lý đúng thứ tự trong khi scale ra 10 instance. Cách làm đúng? [mid]
- [ ] Chỉ chạy 1 instance
- [ ] Đặt `MaxConcurrentCalls=1` trên mỗi instance
- [x] Bật sessions cho queue và đặt `SessionId = OrderId`; mỗi session chỉ bị lock cho một receiver tại một thời điểm, nên giữ được thứ tự trong từng order mà các order khác nhau vẫn chạy song song
- [ ] Dùng ReceiveAndDelete để tránh redelivery làm đảo thứ tự
> `MaxConcurrentCalls=1` chỉ tuần tự hóa trong một instance, 10 instance vẫn lấy message của cùng order song song. Sessions là cơ chế FIFO theo nhóm của Service Bus, tương tự `MessageGroupId` của SQS FIFO.

## Service mở connection RabbitMQ mới cho mỗi lần publish. Ở 2000 msg/s, CPU broker cao và connection churn lớn. Cách đúng? [mid]
- [x] Giữ một connection dài hạn cho mỗi process và mở nhiều channel trên đó (ví dụ mỗi thread publish một channel), không dùng chung một channel cho nhiều thread chạy đồng thời
- [ ] Mở một connection cho mỗi thread và một channel mới cho mỗi message
- [ ] Dùng chung một channel cho mọi thread để tiết kiệm tài nguyên
- [ ] Chuyển sang publish qua HTTP API của management plugin
> Connection là một TCP connection (kèm handshake AMQP, có thể cả TLS) nên tốn kém; channel là kênh logic nhẹ, multiplex trên connection. Channel không thread-safe trong phần lớn client (.NET, Java), nên chia sẻ cho nhiều thread dễ làm hỏng frame.

## Downstream sập 10 phút, 50 consumer retry liên tục ngay lập tức. Khi downstream lên lại thì bị dồn tải và sập tiếp. Chiến lược đúng? [mid]
- [ ] Retry ngay lập tức không giới hạn cho tới khi thành công
- [x] Exponential backoff có jitter, giới hạn số lần, hết lượt thì đưa vào DLQ/parking queue; cân nhắc circuit breaker để tạm dừng consume
- [ ] Mọi consumer cùng chờ cố định 1 giây giữa các lần retry
- [ ] Tăng số consumer để xử lý backlog nhanh hơn
> Delay cố định làm 50 consumer retry đồng loạt theo từng đợt (thundering herd); jitter làm lệch các lần retry ra. Thêm consumer chỉ làm downstream chịu tải nặng hơn.

## Tính năng nào Redis Streams có mà Redis Pub/Sub không có? [mid]
- [ ] Subscribe theo pattern bằng `PSUBSCRIBE`
- [ ] Gửi một message tới nhiều subscriber cùng lúc
- [x] Lưu message bền vững, consumer group với `XREADGROUP`/`XACK` và Pending Entries List để claim lại message chưa ack (`XAUTOCLAIM`)
- [ ] Exactly-once delivery tích hợp sẵn
> Streams là log append-only, có consumer group, ack và PEL, nên consumer chết thì message chưa ack được consumer khác claim lại. Pattern subscribe và broadcast thì Pub/Sub cũng làm được, còn exactly-once thì không cái nào có sẵn.

## Publisher bật publisher confirms và nhận `basic.ack`, nhưng message không nằm trong queue nào. Giải thích nào đúng? [senior]
```text
channel.ConfirmSelect();
channel.BasicPublish(exchange: "orders", routingKey: "order.creatd", mandatory: false, body);
channel.WaitForConfirmsOrDie();   // OK, không lỗi
```
- [ ] Confirm chỉ được gửi sau khi consumer ack, nên chắc chắn message đã được xử lý
- [ ] Broker bị lỗi, vì confirm ack đảm bảo message đã vào ít nhất một queue
- [ ] Message nằm trong DLX mặc định của exchange
- [x] Message không route được (sai routing key) nên bị drop nhưng broker vẫn ack; cần `mandatory=true` (nhận `basic.return` trước ack) hoặc alternate exchange để bắt message này
> Với message unroutable, RabbitMQ ack confirm ngay khi xác định không có queue nào khớp. Confirm không liên quan gì tới consumer, và DLX chỉ áp dụng cho message đã vào queue.

## Partition có RF=3, ISR đã co lại còn {broker 1} (leader). Broker 1 chết hẳn, chỉ còn broker 2 sống nhưng là replica tụt hậu, không nằm trong ISR. Điều gì xảy ra? [senior]
- [x] Với `unclean.leader.election.enable=false` (mặc định), partition offline cho tới khi một replica trong ISR quay lại; nếu bật `true`, broker 2 lên làm leader và các message đã commit mà nó chưa có sẽ mất vĩnh viễn
- [ ] Mặc định broker 2 lên làm leader rồi đồng bộ bù phần thiếu từ log của broker 1 sau
- [ ] Không mất dữ liệu được vì producer dùng `acks=all` nên đã ghi đủ cả 3 replica
- [ ] Controller dừng toàn bộ cluster cho tới khi admin can thiệp
> Unclean election là đánh đổi availability lấy durability. Bẫy ở đây là `acks=all` chỉ chờ ISR tại thời điểm ghi chứ không phải mọi replica: ISR đã còn 1 thì "all" chỉ là 1, nên cần `min.insync.replicas>=2` để chặn việc này.

## Phát biểu nào đúng về idempotent producer của Kafka (`enable.idempotence=true`)? [senior]
- [ ] Nó loại bỏ duplicate end-to-end, kể cả khi consumer xử lý lại message
- [x] Broker dùng Producer ID và sequence number theo từng partition để bỏ các bản ghi trùng do producer retry; nó không chặn được trùng khi ứng dụng tự gọi lại `send()` cho cùng dữ liệu (ví dụ sau khi restart)
- [ ] Nó cần `acks=1` để tránh duplicate
- [ ] Nó đảm bảo thứ tự trên toàn topic
> Idempotence chỉ xử lý trùng do retry ở tầng network trong một producer session; nó cần `acks=all` (và mặc định bật từ Kafka 3.0). Trùng ở tầng ứng dụng hay phía consumer vẫn phải tự xử lý.

## Service consume topic `payments`, ghi Postgres, rồi produce `payment-processed`, dùng Kafka transactions (`sendOffsetsToTransaction`, consumer `isolation.level=read_committed`). Sau một lần crash vẫn thấy dòng trùng trong Postgres. Vì sao? [senior]
- [ ] Phải đặt `isolation.level=read_uncommitted` thì transaction mới có hiệu lực
- [ ] Đây là bug của Kafka, vì EOS đảm bảo exactly-once cho mọi side effect của consumer
- [x] EOS của Kafka chỉ atomic cho việc ghi vào Kafka cộng commit offset; ghi Postgres nằm ngoài transaction nên khi abort rồi retry thì dữ liệu đã được ghi; cần ghi idempotent (unique key/upsert) hoặc lưu offset cùng DB transaction với dữ liệu
- [ ] Cần tăng `transaction.timeout.ms`
> Exactly-once của Kafka chỉ đúng cho luồng read-process-write nằm trọn trong Kafka. Mọi side effect bên ngoài (DB, HTTP, email) cần idempotency hoặc lưu offset atomic cùng với dữ liệu.

## Schema Registry để compatibility `BACKWARD` cho subject Avro. Thay đổi nào sẽ được chấp nhận? [senior]
- [x] Thêm field mới có `default`
- [ ] Thêm field mới không có `default`
- [ ] Đổi kiểu field từ `int` sang `string`
- [ ] Đổi tên field (không có alias, không có default)
> BACKWARD nghĩa là consumer dùng schema mới đọc được dữ liệu ghi bằng schema cũ, nên field mới phải có default để điền cho bản ghi cũ; vì vậy phải nâng cấp consumer trước. Lưu ý `BACKWARD` chỉ kiểm tra với version liền trước, muốn kiểm tra với mọi version thì dùng `BACKWARD_TRANSITIVE`.

## Consumer group 30 pod trên Kubernetes. Mỗi lần rolling deploy, mỗi pod restart lại gây một lần rebalance kiểu stop-the-world, lag tăng vọt. Kết hợp nào hiệu quả nhất? [senior]
- [ ] Tăng gấp đôi số partition
- [ ] Giảm `session.timeout.ms` xuống 1 giây để phát hiện pod chết nhanh hơn
- [x] Static membership (`group.instance.id` ổn định theo pod, `session.timeout.ms` lớn hơn thời gian restart) kết hợp `CooperativeStickyAssignor` để rebalance incremental
- [ ] Bật `enable.auto.commit` để commit nhanh hơn trước khi rebalance
> Static member quay lại trong session timeout thì không gây rebalance; cooperative rebalance chỉ thu hồi các partition cần chuyển thay vì dừng cả group. Giảm session timeout sẽ làm rebalance xảy ra nhiều hơn.

## Queue RabbitMQ `account-events` được scale từ 1 lên 5 consumer (prefetch 10). Bắt đầu thấy `Credit` được xử lý trước `Debit` của cùng một tài khoản. Cách sửa đúng? [senior]
- [ ] Đặt prefetch=1 là đủ giữ thứ tự
- [ ] Chuyển sang priority queue
- [ ] Bật publisher confirms
- [x] Shard theo account: dùng consistent hash exchange (hoặc route theo `hash(accountId) % N`) tới N queue, mỗi queue một consumer hoặc bật `x-single-active-consumer`
> Có nhiều competing consumer thì message liên tiếp được xử lý song song, nên prefetch=1 vẫn đảo thứ tự được; redelivery cũng có thể đảo thứ tự. Muốn vừa song song vừa giữ thứ tự thì phải partition theo key, giống key trong Kafka.

## Phát biểu nào đúng về quorum queue trong RabbitMQ? [senior]
- [ ] Hỗ trợ queue non-durable và exclusive giống classic queue
- [x] Replicate bằng Raft và cần đa số replica sống để nhận ghi, nên 3 replica chịu được 1 node lỗi; có `delivery-limit` để xử lý poison message
- [ ] Replicate bất đồng bộ như classic mirrored queue, 3 replica chịu được 2 node lỗi mà vẫn ghi được
- [ ] Message transient trong quorum queue chỉ nằm trên RAM
> Quorum queue luôn durable và coi mọi message là persistent, nó thay classic mirrored queue (đã bị bỏ ở RabbitMQ 4.0). Với 3 replica, mất 2 node thì mất quorum nên không ghi được.

## Lý do chính khiến Kafka đạt throughput rất cao? [senior]
- [x] Append tuần tự vào log segment, tận dụng OS page cache, zero-copy (`sendfile`) khi gửi cho consumer, batching và nén theo batch
- [ ] Giữ toàn bộ message trong JVM heap để tránh I/O disk
- [ ] fsync từng message xuống disk trước khi ack để khỏi phải ghi lại
- [ ] Broker theo dõi trạng thái của từng message cho từng consumer để giao chính xác
> Kafka để page cache của OS làm cache và mặc định không fsync từng message, durability dựa vào replication. Broker không theo dõi trạng thái từng message, consumer tự quản offset, nên broker rất "nhẹ" (lưu ý zero-copy không áp dụng khi bật TLS).

## Phát biểu nào đúng về KRaft trong Kafka? [senior]
- [ ] KRaft là một định dạng nén mới của Kafka
- [x] Metadata cluster được một controller quorum quản lý bằng Raft (log `__cluster_metadata`), thay cho ZooKeeper; Kafka 4.0 bỏ hẳn ZooKeeper nên phải migrate sang KRaft trước khi nâng cấp
- [ ] KRaft thay cơ chế replication ISR của data partition bằng Raft
- [ ] KRaft chỉ dành cho môi trường dev, production vẫn cần ZooKeeper
> Raft chỉ dùng cho metadata/controller. Replication dữ liệu của partition vẫn dùng leader/follower với ISR như cũ.

## Producer cấu hình `acks=1`, RF=3. Sau khi một leader crash, một số message producer đã nhận ack thành công không còn trong topic (đọc lại từ đầu vẫn không thấy). Nguyên nhân có khả năng nhất? [senior]
- [ ] Consumer commit offset trước khi xử lý
- [ ] Retention đã xóa các message này
- [x] Với `acks=1`, leader ack ngay khi ghi local; leader chết trước khi follower kịp replicate, một follower trong ISR lên làm leader, và khi leader cũ quay lại thì log bị truncate theo leader mới
- [ ] Unclean leader election được bật mặc định
> Cách sửa là `acks=all` cùng `min.insync.replicas=2` (producer từ Kafka 3.0 mặc định đã là `acks=all`). Unclean election mặc định là tắt, và lỗi commit offset của consumer không làm message biến mất khỏi topic.

## Team cần gửi ảnh scan khoảng 20MB qua Kafka (`max.message.bytes` 1MB). Có người đề xuất tăng giới hạn lên 50MB. Hướng tốt hơn? [senior]
- [ ] Tăng `message.max.bytes`/`max.request.size` lên 50MB trên broker và producer
- [ ] Cắt ảnh thành nhiều chunk message và ghép lại ở consumer
- [ ] Nén gzip ở producer
- [x] Claim check: lưu payload vào object storage (S3/Blob), message chỉ chứa reference kèm checksum/metadata; vòng đời của blob phải dài hơn retention và cửa sổ replay từ DLQ
> Message lớn làm nặng replication, page cache và bộ nhớ của consumer, nên broker phù hợp với message nhỏ. Cắt chunk thì phải tự lo thứ tự, thiếu mảnh và lỗi giữa chừng; còn ảnh vốn đã nén nên gzip gần như không giảm được.

## Consumer dùng logic dưới đây mà vẫn thỉnh thoảng xử lý trùng. Vì sao, và cách đúng là gì? [senior]
```csharp
if (!await redis.KeyExistsAsync(msg.Id)) {
    await ProcessAsync(msg);           // ghi DB nghiệp vụ
    await redis.StringSetAsync(msg.Id, "1");
}
```
- [x] Kiểm tra và side effect không atomic: crash sau `ProcessAsync` trước khi set key, hoặc 2 instance nhận redelivery cùng lúc đều thấy chưa có key; nên ghi `msgId` vào bảng `processed_messages` (unique constraint) trong cùng DB transaction với thay đổi nghiệp vụ
- [ ] TTL của key Redis quá dài
- [ ] Do broker gửi trùng, đổi sang broker hỗ trợ exactly-once là hết
- [ ] Đổi sang `SETNX` trước khi gọi `ProcessAsync` là giải quyết triệt để
> Dedup phải atomic với chính thay đổi nghiệp vụ. Dùng `SETNX` trước thì hết trùng, nhưng nếu crash giữa chừng thì message bị đánh dấu đã xử lý mà thực ra chưa làm, tức là mất message.

## Yêu cầu: task queue khoảng 2k msg/s, routing phức tạp theo tenant và loại event, TTL theo message, retry có delay, ưu tiên khách VIP, không cần replay lịch sử, team dùng .NET. Lựa chọn phù hợp nhất? [senior]
- [ ] Kafka, vì có throughput cao nhất
- [x] RabbitMQ (topic/headers exchange, TTL kết hợp DLX, priority queue), dùng qua MassTransit
- [ ] Redis Pub/Sub, vì latency thấp nhất
- [ ] Kafka với log compaction để làm cơ chế ưu tiên
> 2k msg/s nằm trong khả năng của RabbitMQ, mà routing linh hoạt, TTL và priority theo message là thế mạnh của nó, trong khi Kafka không có priority hay routing theo message. Redis Pub/Sub không lưu message nên không dùng làm task queue được.

## MassTransit consumer gọi API bên thứ ba vốn hay sập khoảng 10 phút. Với cấu hình dưới, mọi message lỗi đều vào `order-submitted_error`. Cách đúng? [senior]
```csharp
e.UseMessageRetry(r => r.Interval(5, TimeSpan.FromSeconds(1)));
```
- [ ] Đổi thành `r.Interval(600, TimeSpan.FromSeconds(1))` để retry suốt 10 phút
- [ ] Bắt exception trong consumer rồi return để message được ack
- [x] Thêm delayed redelivery (`UseDelayedRedelivery` với interval 1, 5, 15 phút) bọc ngoài message retry, kèm delayed message scheduler; message được trả về broker với delay thay vì chiếm consumer, hết lượt mới vào `_error`
- [ ] Xóa queue `_error` để MassTransit retry vô hạn
> `UseMessageRetry` retry trong bộ nhớ, giữ message chưa ack và chiếm một slot concurrency, nên retry dài sẽ làm nghẽn consumer. Nuốt exception rồi return thì message được ack và mất luôn.
