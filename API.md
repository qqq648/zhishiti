# **工作流编排对话型应用 API**

对话应用支持会话持久化，可将之前的聊天记录作为上下文进行回答，可适用于聊天/客服 AI 等。

### **基础 URL**

http://localhost/v1

### **鉴权**

Service API 使用 API-Key 进行鉴权。 ***强烈建议开发者把 API-Key 放在后端存储，而非分享或者放在客户端存储，以免 API-Key 泄露，导致财产损失。*** 所有 API 请求都应在 **Authorization** HTTP Header 中包含您的 API-Key，如下所示：

Authorization: Bearer {API\_KEY}

## **POST /chat-messages**

创建会话消息。

### **Request Body**

* **query** (string): 用户输入/提问内容。  
* **inputs** (object): 允许传入 App 定义的各变量值。 inputs 参数包含了多组键值对（Key/Value pairs），每组的键对应一个特定变量，每组的值则是该变量的具体值。 如果变量是文件类型，请指定一个包含以下 files 中所述键的对象。 默认 {}  
* **response\_mode** (string):  
  * streaming 流式模式（推荐）。基于 SSE（[**Server-Sent Events**](https://www.google.com/search?q=https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server_sent_events)）实现类似打字机输出方式的流式返回。  
  * blocking 阻塞模式，等待执行完毕后返回结果。（请求若流程较长可能会被中断）。  
    由于 Cloudflare 限制，请求会在 100 秒超时无返回后中断。  
* **user** (string): 用户标识，用于定义终端用户的身份，方便检索、统计。 由开发者定义规则，需保证用户标识在应用内唯一。服务 API 不会共享 WebApp 创建的对话。  
* **conversation\_id** (string): （选填）会话 ID，需要基于之前的聊天记录继续对话，必须传之前消息的 conversation\_id。  
* **files** (array\[object\]): 文件列表，适用于传入文件结合文本理解并回答问题，仅当模型支持 Vision/Video 能力时可用。  
  * type (string): 支持类型：  
    * document: 具体类型包含：'TXT', 'MD', 'MARKDOWN', 'MDX', 'PDF', 'HTML', 'XLSX', 'XLS', 'VTT', 'PROPERTIES', 'DOC', 'DOCX', 'CSV', 'EML', 'MSG', 'PPTX', 'PPT', 'XML', 'EPUB'  
    * image: 具体类型包含：'JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'SVG'  
    * audio: 具体类型包含：'MP3', 'M4A', 'WAV', 'WEBM', 'MPGA'  
    * video: 具体类型包含：'MP4', 'MOV', 'MPEG', 'WEBM'  
    * custom: 具体类型包含：其他文件类型  
  * transfer\_method (string): 传递方式:remote\_url: 文件地址。local\_file: 上传文件。  
  * url (string): 文件地址。（仅当传递方式为 remote\_url 时）。  
  * upload\_file\_id (string): 上传文件 ID。（仅当传递方式为 local\_file 时）。  
* **auto\_generate\_name** (bool): （选填）自动生成标题，默认 true。 若设置为 false，则可通过调用会话重命名接口并设置 auto\_generate 为 true 实现异步生成标题。  
* **workflow\_id** (string): （选填）工作流ID，用于指定特定版本，如果不提供则使用默认的已发布版本。  
* **trace\_id** (string): （选填）链路追踪ID。适用于与业务系统已有的trace组件打通，实现端到端分布式追踪等场景。如果未指定，系统会自动生成trace\_id。支持以下三种方式传递，具体优先级依次为： Header：通过 HTTP Header X-Trace-Id 传递，优先级最高。 Query 参数：通过 URL 查询参数 trace\_id 传递。 Request Body：通过请求体字段 trace\_id 传递（即本字段）。

### **Request**

curl \-X POST 'http://localhost/v1/chat-messages' \\  
\--header 'Authorization: Bearer {api\_key}' \\  
\--header 'Content-Type: application/json' \\  
\--data-raw '{  
  "inputs": {},  
  "query": "What are the specs of the iPhone 13 Pro Max?",  
  "response\_mode": "streaming",  
  "conversation\_id": "",  
  "user": "abc-123",  
  "files": \[  
      {  
          "type": "image",  
          "transfer\_method": "remote\_url",  
          "url": "\[https://cloud.dify.ai/logo/logo-site.png\](https://cloud.dify.ai/logo/logo-site.png)"  
      }  
  \]  
}'

### **Response**

* 当 response\_mode 为 blocking 时，返回 ChatCompletionResponse object。 当 response\_mode 为 streaming时，返回 ChunkChatCompletionResponse object 流式序列。

#### **ChatCompletionResponse**

返回完整的 App 结果，Content-Type 为 application/json。

* event (string): 事件类型，固定为 message  
* task\_id (string): 任务 ID，用于请求跟踪和下方的停止响应接口  
* id (string): 唯一ID  
* message\_id (string): 消息唯一 ID  
* conversation\_id (string): 会话 ID  
* mode (string): App 模式，固定为 chat  
* answer (string): 完整回复内容  
* metadata(object): 元数据  
  * usage (Usage): 模型用量信息  
  * retriever\_resources (array\[RetrieverResource\]): 引用和归属分段列表  
* created\_at (int): 消息创建时间戳，如：1705395332

#### **ChunkChatCompletionResponse**

返回 App 输出的流式块，Content-Type 为 text/event-stream。 每个流式块均为 data: 开头，块之间以 \\n\\n 即两个换行符分隔，如下所示：

data: {"event": "message", "task\_id": "900bbd43-dc0b-4383-a372-aa6e6c414227", "id": "663c5084-a254-4040-8ad3-51f2a3c1a77c", "answer": "Hi", "created\_at": 1705398420}\\n\\n

流式块中根据 event 不同，结构也不同：

* **event: message**: LLM 返回文本块事件，即：完整的文本以分块的方式输出。  
  * task\_id (string): 任务 ID，用于请求跟踪和下方的停止响应接口  
  * message\_id (string): 消息唯一 ID  
  * conversation\_id (string): 会话 ID  
  * answer (string): LLM 返回文本块内容  
  * created\_at (int): 创建时间戳，如：1705395332  
* **event: message\_file**: 文件事件，表示有新文件需要展示  
  * id (string): 文件唯一ID  
  * type (string): 文件类型，目前仅为image  
  * belongs\_to (string): 文件归属，user或assistant，该接口返回仅为 assistant  
  * url (string): 文件访问地址  
  * conversation\_id (string): 会话ID  
* **event: message\_end**: 消息结束事件，收到此事件则代表流式返回结束。  
  * task\_id (string): 任务 ID，用于请求跟踪和下方的停止响应接口  
  * message\_id (string): 消息唯一 ID  
  * conversation\_id (string): 会话 ID  
  * metadata (object): 元数据  
    * usage (Usage): 模型用量信息  
    * retriever\_resources (array\[RetrieverResource\]): 引用和归属分段列表  
* **event: tts\_message**: TTS 音频流事件，即：语音合成输出。内容是Mp3格式的音频块，使用 base64 编码后的字符串，播放的时候直接解码即可。(开启自动播放才有此消息)  
  * task\_id (string): 任务 ID，用于请求跟踪和下方的停止响应接口  
  * message\_id (string): 消息唯一 ID  
  * audio (string): 语音合成之后的音频块使用 Base64 编码之后的文本内容，播放的时候直接 base64 解码送入播放器即可  
  * created\_at (int): 创建时间戳，如：1705395332  
* **event: tts\_message\_end**: TTS 音频流结束事件，收到这个事件表示音频流返回结束。  
  * task\_id (string): 任务 ID，用于请求跟踪和下方的停止响应接口  
  * message\_id (string): 消息唯一 ID  
  * audio (string): 结束事件是没有音频的，所以这里是空字符串  
  * created\_at (int): 创建时间戳，如：1705395332  
* **event: message\_replace**: 消息内容替换事件。 开启内容审查和审查输出内容时，若命中了审查条件，则会通过此事件替换消息内容为预设回复。  
  * task\_id (string): 任务 ID，用于请求跟踪和下方的停止响应接口  
  * message\_id (string): 消息唯一 ID  
  * conversation\_id (string): 会话 ID  
  * answer (string): 替换内容（直接替换 LLM 所有回复文本）  
  * created\_at (int): 创建时间戳，如：1705395332  
* **event: workflow\_started**: workflow 开始执行  
  * task\_id (string): 任务 ID，用于请求跟踪和下方的停止响应接口  
  * workflow\_run\_id (string): workflow 执行 ID  
  * event (string): 固定为 workflow\_started  
  * data (object): 详细内容  
    * id (string): workflow 执行 ID  
    * workflow\_id (string): 关联 Workflow ID  
    * created\_at (timestamp): 开始时间  
* **event: node\_started**: node 开始执行  
  * task\_id (string): 任务 ID，用于请求跟踪和下方的停止响应接口  
  * workflow\_run\_id (string): workflow 执行 ID  
  * event (string): 固定为 node\_started  
  * data (object): 详细内容  
    * id (string): workflow 执行 ID  
    * node\_id (string): 节点 ID  
    * node\_type (string): 节点类型  
    * title (string): 节点名称  
    * index (int): 执行序号，用于展示 Tracing Node 顺序  
    * predecessor\_node\_id (string): 前置节点 ID，用于画布展示执行路径  
    * inputs (object): 节点中所有使用到的前置节点变量内容  
    * created\_at (timestamp): 开始时间  
* **event: node\_finished**: node 执行结束，成功失败同一事件中不同状态  
  * task\_id (string): 任务 ID，用于请求跟踪和下方的停止响应接口  
  * workflow\_run\_id (string): workflow 执行 ID  
  * event (string): 固定为 node\_finished  
  * data (object): 详细内容  
    * id (string): node 执行 ID  
    * node\_id (string): 节点 ID  
    * index (int): 执行序号，用于展示 Tracing Node 顺序  
    * predecessor\_node\_id (string): optional 前置节点 ID，用于画布展示执行路径  
    * inputs (object): 节点中所有使用到的前置节点变量内容  
    * process\_data (json): Optional 节点过程数据  
    * outputs (json): Optional 输出内容  
    * status (string): 执行状态 running / succeeded / failed / stopped  
    * error (string): Optional 错误原因  
    * elapsed\_time (float): Optional 耗时(s)  
    * execution\_metadata (json): 元数据  
      * total\_tokens (int): optional 总使用 tokens  
      * total\_price (decimal): optional 总费用  
      * currency (string): optional 货币，如 USD / RMB  
    * created\_at (timestamp): 开始时间  
* **event: workflow\_finished**: workflow 执行结束，成功失败同一事件中不同状态  
  * task\_id (string): 任务 ID，用于请求跟踪和下方的停止响应接口  
  * workflow\_run\_id (string): workflow 执行 ID  
  * event (string): 固定为 workflow\_finished  
  * data (object): 详细内容  
    * id (string): workflow 执行 ID  
    * workflow\_id (string): 关联 Workflow ID  
    * status (string): 执行状态 running / succeeded / failed / stopped  
    * outputs (json): Optional 输出内容  
    * error (string): Optional 错误原因  
    * elapsed\_time (float): Optional 耗时(s)  
    * total\_tokens (int): Optional 总使用 tokens  
    * total\_steps (int): 总步数（冗余），默认 0  
    * created\_at (timestamp): 开始时间  
    * finished\_at (timestamp): 结束时间  
* **event: error**: 流式输出过程中出现的异常会以 stream event 形式输出，收到异常事件后即结束。  
  * task\_id (string): 任务 ID，用于请求跟踪和下方的停止响应接口  
  * message\_id (string): 消息唯一 ID  
  * status (int): HTTP 状态码  
  * code (string): 错误码  
  * message (string): 错误消息  
* **event: ping**: 每 10s 一次的 ping 事件，保持连接存活。

### **Errors**

* 404，对话不存在  
* 400，invalid\_param，传入参数异常  
* 400，app\_unavailable，App 配置不可用  
* 400，provider\_not\_initialize，无可用模型凭据配置  
* 400，provider\_quota\_exceeded，模型调用额度不足  
* 400，model\_currently\_not\_support，当前模型不可用  
* 400，workflow\_not\_found，指定的工作流版本未找到  
* 400，draft\_workflow\_error，无法使用草稿工作流版本  
* 400，workflow\_id\_format\_error，工作流ID格式错误，需要UUID格式  
* 400，completion\_request\_error，文本生成失败  
* 500，服务内部异常

### **阻塞模式 Response**

{  
    "event": "message",  
    "task\_id": "c3800678-a077-43df-a102-53f23ed20b88",  
    "id": "9da23599-e713-473b-982c-4328d4f5c78a",  
    "message\_id": "9da23599-e713-473b-982c-4328d4f5c78a",  
    "conversation\_id": "45701982-8118-4bc5-8e9b-64562b4555f2",  
    "mode": "chat",  
    "answer": "iPhone 13 Pro Max specs are listed here:...",  
    "metadata": {  
        "usage": {  
            "prompt\_tokens": 1033,  
            "prompt\_unit\_price": "0.001",  
            "prompt\_price\_unit": "0.001",  
            "prompt\_price": "0.0010330",  
            "completion\_tokens": 128,  
            "completion\_unit\_price": "0.002",  
            "completion\_price\_unit": "0.001",  
            "completion\_price": "0.0002560",  
            "total\_tokens": 1161,  
            "total\_price": "0.0012890",  
            "currency": "USD",  
            "latency": 0.7682376249867957  
        },  
        "retriever\_resources": \[  
            {  
                "position": 1,  
                "dataset\_id": "101b4c97-fc2e-463c-90b1-5261a4cdcafb",  
                "dataset\_name": "iPhone",  
                "document\_id": "8dd1ad74-0b5f-4175-b735-7d98bbbb4e00",  
                "document\_name": "iPhone List",  
                "segment\_id": "ed599c7f-2766-4294-9d1d-e5235a61270a",  
                "score": 0.98457545,  
                "content": "\\"Model\\",\\"Release Date\\",\\"Display Size\\",\\"Resolution\\",\\"Processor\\",\\"RAM\\",\\"Storage\\",\\"Camera\\",\\"Battery\\",\\"Operating System\\"\\n\\"iPhone 13 Pro Max\\",\\"September 24, 2021\\",\\"6.7 inch\\",\\"1284 x 2778\\",\\"Hexa-core (2x3.23 GHz Avalanche \+ 4x1.82 GHz Blizzard)\\",\\"6 GB\\",\\"128, 256, 512 GB, 1TB\\",\\"12 MP\\",\\"4352 mAh\\",\\"iOS 15\\""  
            }  
        \]  
    },  
    "created\_at": 1705407629  
}

### **流式模式 Response**

data: {"event": "workflow\_started", "task\_id": "5ad4cb98-f0c7-4085-b384-88c403be6290", "workflow\_run\_id": "5ad498-f0c7-4085-b384-88cbe6290", "data": {"id": "5ad498-f0c7-4085-b384-88cbe6290", "workflow\_id": "dfjasklfjdslag", "created\_at": 1679586595}}  
data: {"event": "node\_started", "task\_id": "5ad4cb98-f0c7-4085-b384-88c403be6290", "workflow\_run\_id": "5ad498-f0c7-4085-b384-88cbe6290", "data": {"id": "5ad498-f0c7-4085-b384-88cbe6290", "node\_id": "dfjasklfjdslag", "node\_type": "start", "title": "Start", "index": 0, "predecessor\_node\_id": "fdljewklfklgejlglsd", "inputs": {}, "created\_at": 1679586595}}  
data: {"event": "node\_finished", "task\_id": "5ad4cb98-f0c7-4085-b384-88c403be6290", "workflow\_run\_id": "5ad498-f0c7-4085-b384-88cbe6290", "data": {"id": "5ad498-f0c7-4085-b384-88cbe6290", "node\_id": "dfjasklfjdslag", "node\_type": "start", "title": "Start", "index": 0, "predecessor\_node\_id": "fdljewklfklgejlglsd", "inputs": {}, "outputs": {}, "status": "succeeded", "elapsed\_time": 0.324, "execution\_metadata": {"total\_tokens": 63127864, "total\_price": 2.378, "currency": "USD"},  "created\_at": 1679586595}}  
data: {"event": "workflow\_finished", "task\_id": "5ad4cb98-f0c7-4085-b384-88c403be6290", "workflow\_run\_id": "5ad498-f0c7-4085-b384-88cbe6290", "data": {"id": "5ad498-f0c7-4085-b384-88cbe6290", "workflow\_id": "dfjasklfjdslag", "outputs": {}, "status": "succeeded", "elapsed\_time": 0.324, "total\_tokens": 63127864, "total\_steps": "1", "created\_at": 1679586595, "finished\_at": 1679976595}}  
data: {"event": "message", "message\_id": "5ad4cb98-f0c7-4085-b384-88c403be6290", "conversation\_id": "45701982-8118-4bc5-8e9b-64562b4555f2", "answer": " I", "created\_at": 1679586595}  
data: {"event": "message", "message\_id": "5ad4cb98-f0c7-4085-b384-88c403be6290", "conversation\_id": "45701982-8118-4bc5-8e9b-64562b4555f2", "answer": "'m", "created\_at": 1679586595}  
data: {"event": "message", "message\_id": "5ad4cb98-f0c7-4085-b384-88c403be6290", "conversation\_id": "45701982-8118-4bc5-8e9b-64562b4555f2", "answer": " glad", "created\_at": 1679586595}  
data: {"event": "message", "message\_id": "5ad4cb98-f0c7-4085-b384-88c403be6290", "conversation\_id": "45701982-8118-4bc5-8e9b-64562b4555f2", "answer": " to", "created\_at": 1679586595}  
data: {"event": "message", "message\_id" : "5ad4cb98-f0c7-4085-b384-88c403be6290", "conversation\_id": "45701982-8118-4bc5-8e9b-64562b4555f2", "answer": " meet", "created\_at": 1679586595}  
data: {"event": "message", "message\_id" : "5ad4cb98-f0c7-4085-b384-88c403be6290", "conversation\_id": "45701982-8118-4bc5-8e9b-64562b4555f2", "answer": " you", "created\_at": 1679586595}  
data: {"event": "message\_end", "id": "5e52ce04-874b-4d27-9045-b3bc80def685", "conversation\_id": "45701982-8118-4bc5-8e9b-64562b4555f2", "metadata": {"usage": {"prompt\_tokens": 1033, "prompt\_unit\_price": "0.001", "prompt\_price\_unit": "0.001", "prompt\_price": "0.0010330", "completion\_tokens": 135, "completion\_unit\_price": "0.002", "completion\_price\_unit": "0.001", "completion\_price": "0.0002700", "total\_tokens": 1168, "total\_price": "0.0013030", "currency": "USD", "latency": 1.381760165997548}, "retriever\_resources": \[{"position": 1, "dataset\_id": "101b4c97-fc2e-463c-90b1-5261a4cdcafb", "dataset\_name": "iPhone", "document\_id": "8dd1ad74-0b5f-4175-b735-7d98bbbb4e00", "document\_name": "iPhone List", "segment\_id": "ed599c7f-2766-4294-9d1d-e5235a61270a", "score": 0.98457545, "content": "\\"Model\\",\\"Release Date\\",\\"Display Size\\",\\"Resolution\\",\\"Processor\\",\\"RAM\\",\\"Storage\\",\\"Camera\\",\\"Battery\\",\\"Operating System\\"\\n\\"iPhone 13 Pro Max\\",\\"September 24, 2021\\",\\"6.7 inch\\",\\"1284 x 2778\\",\\"Hexa-core (2x3.23 GHz Avalanche \+ 4x1.82 GHz Blizzard)\\",\\"6 GB\\",\\"128, 256, 512 GB, 1TB\\",\\"12 MP\\",\\"4352 mAh\\",\\"iOS 15\\""}\]}}  
data: {"event": "tts\_message", "conversation\_id": "23dd85f3-1a41-4ea0-b7a9-062734ccfaf9", "message\_id": "a8bdc41c-13b2-4c18-bfd9-054b9803038c", "created\_at": 1721205487, "task\_id": "3bf8a0bb-e73b-4690-9e66-4e429bad8ee7", "audio": "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq"}  
data: {"event": "tts\_message\_end", "conversation\_id": "23dd85f3-1a41-4ea0-b7a9-062734ccfaf9", "message\_id": "a8bdc41c-13b2-4c18-bfd9-054b9803038c", "created\_at": 1721205487, "task\_id": "3bf8a0bb-e73b-4690-9e66-4e429bad8ee7", "audio": ""}

## **POST /files/upload**

上传文件并在发送消息时使用，可实现图文多模态理解。 支持您的应用程序所支持的所有格式。 *上传的文件仅供当前终端用户使用。*

### **Request Body**

该接口需使用 multipart/form-data 进行请求。

* **file** (file): 要上传的文件。  
* **user** (string): 用户标识，用于定义终端用户的身份，必须和发送消息接口传入 user 保持一致。

### **Response**

成功上传后，服务器会返回文件的 ID 和相关信息。

* id (uuid): ID  
* name (string): 文件名  
* size (int): 文件大小（byte）  
* extension (string): 文件后缀  
* mime\_type (string): 文件 mime-type  
* created\_by (uuid): 上传人 ID  
* created\_at (timestamp): 上传时间

### **Errors**

* 400，no\_file\_uploaded，必须提供文件  
* 400，too\_many\_files，目前只接受一个文件  
* 400，unsupported\_preview，该文件不支持预览  
* 400，unsupported\_estimate，该文件不支持估算  
* 413，file\_too\_large，文件太大  
* 415，unsupported\_file\_type，不支持的扩展名，当前只接受文档类文件  
* 503，s3\_connection\_failed，无法连接到 S3 服务  
* 503，s3\_permission\_denied，无权限上传文件到 S3  
* 503，s3\_file\_too\_large，文件超出 S3 大小限制

### **Request**

curl \-X POST 'http://localhost/v1/files/upload' \\  
\--header 'Authorization: Bearer {api\_key}' \\  
\--form 'file=@localfile;type=image/\[png|jpeg|jpg|webp|gif\]' \\  
\--form 'user=abc-123'

### **Response**

{  
  "id": "72fa9618-8f89-4a37-9b33-7e1178a24a67",  
  "name": "example.png",  
  "size": 1024,  
  "extension": "png",  
  "mime\_type": "image/png",  
  "created\_by": 123,  
  "created\_at": 1577836800  
}

## **GET /files/:file\_id/preview**

预览或下载已上传的文件。此端点允许您访问先前通过文件上传 API 上传的文件。

*文件只能在属于请求应用程序的消息范围内访问。*

### **路径参数**

* **file\_id** (string) 必需: 要预览的文件的唯一标识符，从文件上传 API 响应中获得。

### **查询参数**

* **as\_attachment** (boolean) 可选: 是否强制将文件作为附件下载。默认为 false（在浏览器中预览）。

### **响应**

返回带有适当浏览器显示或下载标头的文件内容。

* Content-Type: 根据文件 MIME 类型设置  
* Content-Length: 文件大小（以字节为单位，如果可用）  
* Content-Disposition: 如果 as\_attachment=true 则设置为 "attachment"  
* Cache-Control: 用于性能的缓存标头  
* Accept-Ranges: 对于音频/视频文件设置为 "bytes"

### **错误**

* 400, invalid\_param, 参数输入异常  
* 403, file\_access\_denied, 文件访问被拒绝或文件不属于当前应用程序  
* 404, file\_not\_found, 文件未找到或已被删除  
* 500, 服务内部错误

### **请求示例**

curl \-X GET 'http://localhost/v1/files/72fa9618-8f89-4a37-9b33-7e1178a24a67/preview' \\  
\--header 'Authorization: Bearer {api\_key}'

### **作为附件下载**

curl \-X GET 'http://localhost/v1/files/72fa9618-8f89-4a37-9b33-7e1178a24a67/preview?as\_attachment=true' \\  
\--header 'Authorization: Bearer {api\_key}' \\  
\--output downloaded\_file.png

### **响应标头示例**

Content-Type: image/png  
Content-Length: 1024  
Cache-Control: public, max-age=3600

### **文件下载响应标头**

Content-Type: image/png  
Content-Length: 1024  
Content-Disposition: attachment; filename\*=UTF-8''example.png  
Cache-Control: public, max-age=3600

## **POST /chat-messages/:task\_id/stop**

停止响应。仅支持流式模式。

### **Path**

* **task\_id** (string): 任务 ID，可在流式返回 Chunk 中获取

### **Request Body**

* **user** (string) Required: 用户标识，用于定义终端用户的身份，必须和发送消息接口传入 user 保持一致。API 无法访问 WebApp 创建的会话。

### **Response**

* result (string): 固定返回 success

### **Request**

curl \-X POST 'http://localhost/v1/chat-messages/:task\_id/stop' \\  
\-H 'Authorization: Bearer {api\_key}' \\  
\-H 'Content-Type: application/json' \\  
\--data-raw '{  
  "user": "abc-123"  
}'

### **Response**

{  
  "result": "success"  
}

## **POST /messages/:message\_id/feedbacks**

消息反馈（点赞）。消息终端用户反馈、点赞，方便应用开发者优化输出预期。

### **Path Params**

* **message\_id** (string): 消息 ID

### **Request Body**

* **rating** (string): 点赞 like, 点踩 dislike, 撤销点赞 null  
* **user** (string): 用户标识，由开发者定义规则，需保证用户标识在应用内唯一。  
* **content** (string): 消息反馈的具体信息。

### **Response**

* result (string): 固定返回 success

### **Request**

curl \-X POST 'http://localhost/v1/messages/:message\_id/feedbacks' \\  
\--header 'Authorization: Bearer {api\_key}' \\  
\--header 'Content-Type: application/json' \\  
\--data-raw '{  
  "rating": "like",  
  "user": "abc-123",  
  "content": "message feedback information"  
}'

### **Response**

{  
  "result": "success"  
}

## **GET /app/feedbacks**

获取APP的消息点赞和反馈。获取应用的终端用户反馈、点赞。

### **Query**

* **page** (string): （选填）分页，默认值：1  
* **limit** (string): （选填）每页数量，默认值：20

### **Response**

* data (List): 返回该APP的点赞、反馈列表。

### **Request**

curl \-X GET 'http://localhost/v1/app/feedbacks?page=1\&limit=20' \\  
\--header 'Authorization: Bearer {api\_key}' \\  
\--header 'Content-Type: application/json'

### **Response**

{  
  "data": \[  
    {  
      "id": "8c0fbed8-e2f9-49ff-9f0e-15a35bdd0e25",  
      "app\_id": "f252d396-fe48-450e-94ec-e184218e7346",  
      "conversation\_id": "2397604b-9deb-430e-b285-4726e51fd62d",  
      "message\_id": "709c0b0f-0a96-4a4e-91a4-ec0889937b11",  
      "rating": "like",  
      "content": "message feedback information-3",  
      "from\_source": "user",  
      "from\_end\_user\_id": "74286412-9a1a-42c1-929c-01edb1d381d5",  
      "from\_account\_id": null,  
      "created\_at": "2025-04-24T09:24:38",  
      "updated\_at": "2025-04-24T09:24:38"  
    }  
  \]  
}

## **GET /messages/{message\_id}/suggested**

获取下一轮建议问题列表。

### **Path Params**

* **message\_id** (string): Message ID

### **Query**

* **user** (string): 用户标识，由开发者定义规则，需保证用户标识在应用内唯一。

### **Request**

curl \--location \--request GET 'http://localhost/v1/messages/{message\_id}/suggested?user=abc-123' \\  
\--header 'Authorization: Bearer ENTER-YOUR-SECRET-KEY' \\  
\--header 'Content-Type: application/json'

### **Response**

{  
  "result": "success",  
  "data": \[  
    "a",  
    "b",  
    "c"  
  \]  
}

## **GET /messages**

获取会话历史消息。滚动加载形式返回历史聊天记录，第一页返回最新 limit 条，即：倒序返回。

### **Query**

* **conversation\_id** (string): 会话 ID  
* **user** (string): 用户标识，由开发者定义规则，需保证用户标识在应用内唯一。  
* **first\_id** (string): 当前页第一条聊天记录的 ID，默认 null  
* **limit** (int): 一次请求返回多少条聊天记录，默认 20 条。

### **Response**

* **data** (array\[object\]): 消息列表  
  * id (string): 消息 ID  
  * conversation\_id (string): 会话 ID  
  * inputs (object): 用户输入参数。  
  * query (string): 用户输入 / 提问内容。  
  * message\_files (array\[object\]): 消息文件  
    * id (string): ID  
    * type (string): 文件类型，image 图片  
    * url (string): 文件预览地址，使用文件预览 API (/files/{file\_id}/preview) 访问文件  
    * belongs\_to (string): 文件归属方，user 或 assistant  
  * answer (string): 回答消息内容  
  * created\_at (timestamp): 创建时间  
  * feedback (object): 反馈信息  
    * rating (string): 点赞 like / 点踩 dislike  
  * retriever\_resources (array\[RetrieverResource\]): 引用和归属分段列表  
* **has\_more** (bool): 是否存在下一页  
* **limit** (int): 返回条数，若传入超过系统限制，返回系统限制数量

### **Request**

curl \-X GET 'http://localhost/v1/messages?user=abc-123\&conversation\_id={conversation\_id}'  
\--header 'Authorization: Bearer {api\_key}'

### **Response**

{  
  "limit": 20,  
  "has\_more": false,  
  "data": \[  
    {  
      "id": "a076a87f-31e5-48dc-b452-0061adbbc922",  
      "conversation\_id": "cd78daf6-f9e4-4463-9ff2-54257230a0ce",  
      "inputs": {  
        "name": "dify"  
      },  
      "query": "iphone 13 pro",  
      "answer": "The iPhone 13 Pro, released on September 24, 2021, features a 6.1-inch display with a resolution of 1170 x 2532\. It is equipped with a Hexa-core (2x3.23 GHz Avalanche \+ 4x1.82 GHz Blizzard) processor, 6 GB of RAM, and offers storage options of 128 GB, 256 GB, 512 GB, and 1 TB. The camera is 12 MP, the battery capacity is 3095 mAh, and it runs on iOS 15.",  
      "message\_files": \[\],  
      "feedback": null,  
      "retriever\_resources": \[  
        {  
          "position": 1,  
          "dataset\_id": "101b4c97-fc2e-463c-90b1-5261a4cdcafb",  
          "dataset\_name": "iPhone",  
          "document\_id": "8dd1ad74-0b5f-4175-b735-7d98bbbb4e00",  
          "document\_name": "iPhone List",  
          "segment\_id": "ed599c7f-2766-4294-9d1d-e5235a61270a",  
          "score": 0.98457545,  
          "content": "\\"Model\\",\\"Release Date\\",\\"Display Size\\",\\"Resolution\\",\\"Processor\\",\\"RAM\\",\\"Storage\\",\\"Camera\\",\\"Battery\\",\\"Operating System\\"\\n\\"iPhone 13 Pro Max\\",\\"September 24, 2021\\",\\"6.7 inch\\",\\"1284 x 2778\\",\\"Hexa-core (2x3.23 GHz Avalanche \+ 4x1.82 GHz Blizzard)\\",\\"6 GB\\",\\"128, 256, 512 GB, 1TB\\",\\"12 MP\\",\\"4352 mAh\\",\\"iOS 15\\""  
        }  
      \],  
      "created\_at": 1705569239  
    }  
  \]  
}

### **Response Example(智能助手)**

{  
  "limit": 20,  
  "has\_more": false,  
  "data": \[  
    {  
      "id": "d35e006c-7c4d-458f-9142-be4930abdf94",  
      "conversation\_id": "957c068b-f258-4f89-ba10-6e8a0361c457",  
      "inputs": {},  
      "query": "draw a cat",  
      "answer": "I have generated an image of a cat for you. Please check your messages to view the image.",  
      "message\_files": \[  
        {  
          "id": "976990d2-5294-47e6-8f14-7356ba9d2d76",  
          "type": "image",  
          "url": "\[http://127.0.0.1:5001/files/tools/976990d2-5294-47e6-8f14-7356ba9d2d76.png?timestamp=1705988524\&nonce=55df3f9f7311a9acd91bf074cd524092\&sign=z43nMSO1L2HBvoqADLkRxr7Biz0fkjeDstnJiCK1zh8=\](http://127.0.0.1:5001/files/tools/976990d2-5294-47e6-8f14-7356ba9d2d76.png?timestamp=1705988524\&nonce=55df3f9f7311a9acd91bf074cd524092\&sign=z43nMSO1L2HBvoqADLkRxr7Biz0fkjeDstnJiCK1zh8=)",  
          "belongs\_to": "assistant"  
        }  
      \],  
      "feedback": null,  
      "retriever\_resources": \[\],  
      "created\_at": 1705988187  
    }  
  \]  
}

## **GET /conversations**

获取会话列表。获取当前用户的会话列表，默认返回最近的 20 条。

### **Query**

* **user** (string): 用户标识，由开发者定义规则，需保证用户标识在应用内唯一。  
* **last\_id** (string): （选填）当前页最后面一条记录的 ID，默认 null  
* **limit** (int): （选填）一次请求返回多少条记录，默认 20 条，最大 100 条，最小 1 条。  
* **sort\_by** (string): （选填）排序字段，默认 \-updated\_at(按更新时间倒序排列)可选值：created\_at, \-created\_at, updated\_at, \-updated\_at字段前面的符号代表顺序或倒序，-代表倒序

### **Response**

* **data** (array\[object\]): 会话列表  
  * id (string): 会话 ID  
  * name (string): 会话名称，默认由大语言模型生成。  
  * inputs (object): 用户输入参数。  
  * status (string): 会话状态  
  * introduction (string): 开场白  
  * created\_at (timestamp): 创建时间  
  * updated\_at (timestamp): 更新时间  
* **has\_more** (bool)  
* **limit** (int): 返回条数，若传入超过系统限制，返回系统限制数量

### **Request**

curl \-X GET 'http://localhost/v1/conversations?user=abc-123\&last\_id=\&limit=20' \\  
\--header 'Authorization: Bearer {api\_key}'

### **Response**

{  
  "limit": 20,  
  "has\_more": false,  
  "data": \[  
    {  
      "id": "10799fb8-64f7-4296-bbf7-b42bfbe0ae54",  
      "name": "New chat",  
      "inputs": {  
        "book": "book",  
        "myName": "Lucy"  
      },  
      "status": "normal",  
      "created\_at": 1679667915,  
      "updated\_at": 1679667915  
    },  
    {  
      "id": "hSIhXBhNe8X1d8Et"  
      // ...  
    }  
  \]  
}

## **DELETE /conversations/:conversation\_id**

删除会话。

### **Path**

* **conversation\_id** (string): 会话 ID

### **Request Body**

* **user** (string): 用户标识，由开发者定义规则，需保证用户标识在应用内唯一。

### **Response**

* result (string): 固定返回 success

### **Request**

curl \-X DELETE 'http://localhost/v1/conversations/{conversation\_id}' \\  
\--header 'Content-Type: application/json' \\  
\--header 'Accept: application/json' \\  
\--header 'Authorization: Bearer {api\_key}' \\  
\--data '{  
  "user": "abc-123"  
}'

### **Response**

204 No Content

## **POST /conversations/:conversation\_id/name**

会话重命名。对会话进行重命名，会话名称用于显示在支持多会话的客户端上。

### **Path**

* **conversation\_id** (string): 会话 ID

### **Request Body**

* **name** (string): （选填）名称，若 auto\_generate 为 true 时，该参数可不传。  
* **auto\_generate** (bool): （选填）自动生成标题，默认 false。  
* **user** (string): 用户标识，由开发者定义规则，需保证用户标识在应用内唯一。

### **Response**

* id (string): 会话 ID  
* name (string): 会话名称  
* inputs (object): 用户输入参数  
* status (string): 会话状态  
* introduction (string): 开场白  
* created\_at (timestamp): 创建时间  
* updated\_at (timestamp): 更新时间

### **Request**

curl \-X POST 'http://localhost/v1/conversations/{conversation\_id}/name' \\  
\--header 'Content-Type: application/json' \\  
\--header 'Authorization: Bearer {api\_key}' \\  
\--data-raw '{  
  "name": "",  
  "auto\_generate": true,  
  "user": "abc-123"  
}'

### **Response**

{  
  "id": "34d511d5-56de-4f16-a997-57b379508443",  
  "name": "hello",  
  "inputs": {},  
  "status": "normal",  
  "introduction": "",  
  "created\_at": 1732731141,  
  "updated\_at": 1732734510  
}

## **GET /conversations/:conversation\_id/variables**

获取对话变量。从特定对话中检索变量。此端点对于提取对话过程中捕获的结构化数据非常有用。

### **路径参数**

* **conversation\_id** (string): 要从中检索变量的对话ID。

### **查询参数**

* **user** (string): 用户标识符，由开发人员定义的规则，在应用程序内必须唯一。  
* **last\_id** (string): （选填）当前页最后面一条记录的 ID，默认 null  
* **limit** (int): （选填）一次请求返回多少条记录，默认 20 条，最大 100 条，最小 1 条。

### **响应**

* limit (int): 每页项目数  
* has\_more (bool): 是否有更多项目  
* **data** (array\[object\]): 变量列表  
  * id (string): 变量 ID  
  * name (string): 变量名称  
  * value\_type (string): 变量类型（字符串、数字、布尔等）  
  * value (string): 变量值  
  * description (string): 变量描述  
  * created\_at (int): 创建时间戳  
  * updated\_at (int): 最后更新时间戳

### **错误**

* 404, conversation\_not\_exists, 对话不存在

### **Request**

curl \-X GET 'http://localhost/v1/conversations/{conversation\_id}/variables?user=abc-123' \\  
\--header 'Authorization: Bearer {api\_key}'

### **带变量名过滤的请求**

curl \-X GET 'http://localhost/v1/conversations/{conversation\_id}/variables?user=abc-123\&variable\_name=customer\_name' \\  
\--header 'Authorization: Bearer {api\_key}'

### **Response**

{  
  "limit": 100,  
  "has\_more": false,  
  "data": \[  
    {  
      "id": "variable-uuid-1",  
      "name": "customer\_name",  
      "value\_type": "string",  
      "value": "John Doe",  
      "description": "客户名称（从对话中提取）",  
      "created\_at": 1650000000000,  
      "updated\_at": 1650000000000  
    },  
    {  
      "id": "variable-uuid-2",  
      "name": "order\_details",  
      "value\_type": "json",  
      "value": "{\\"product\\":\\"Widget\\",\\"quantity\\":5,\\"price\\":19.99}",  
      "description": "客户的订单详情",  
      "created\_at": 1650000000000,  
      "updated\_at": 1650000000000  
    }  
  \]  
}

## **PUT /conversations/:conversation\_id/variables/:variable\_id**

更新对话变量。更新特定对话变量的值。此端点允许您修改在对话过程中捕获的变量值，同时保留其名称、类型和描述。

### **路径参数**

* **conversation\_id** (string): 包含要更新变量的对话ID。  
* **variable\_id** (string): 要更新的变量ID。

### **请求体**

* **value** (any): 变量的新值。必须匹配变量的预期类型（字符串、数字、对象等）。  
* **user** (string): 用户标识符，由开发人员定义的规则，在应用程序内必须唯一。

### **响应**

返回包含以下内容的更新变量对象：

* id (string): 变量ID  
* name (string): 变量名称  
* value\_type (string): 变量类型（字符串、数字、对象等）  
* value (any): 更新后的变量值  
* description (string): 变量描述  
* created\_at (int): 创建时间戳  
* updated\_at (int): 最后更新时间戳

### **错误**

* 400, Type mismatch: variable expects {expected\_type}, but got {actual\_type} type, 值类型与变量的预期类型不匹配  
* 404, conversation\_not\_exists, 对话不存在  
* 404, conversation\_variable\_not\_exists, 变量不存在

### **Request**

curl \-X PUT 'http://localhost/v1/conversations/{conversation\_id}/variables/{variable\_id}' \\  
\--header 'Content-Type: application/json' \\  
\--header 'Authorization: Bearer {api\_key}' \\  
\--data-raw '{  
  "value": "Updated Value",  
  "user": "abc-123"  
}'

### **使用不同值类型更新**

curl \-X PUT 'http://localhost/v1/conversations/{conversation\_id}/variables/{variable\_id}' \\  
\--header 'Content-Type: application/json' \\  
\--header 'Authorization: Bearer {api\_key}' \\  
\--data-raw '{  
  "value": "新的字符串值",  
  "user": "abc-123"  
}'

### **Response**

{  
  "id": "variable-uuid-1",  
  "name": "customer\_name",  
  "value\_type": "string",  
  "value": "Updated Value",  
  "description": "客户名称（从对话中提取）",  
  "created\_at": 1650000000000,  
  "updated\_at": 1650000001000  
}

## **POST /audio-to-text**

语音转文字。

### **Request Body**

该接口需使用 multipart/form-data 进行请求。

* **file** (file): 语音文件。 支持格式：\['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'\] 文件大小限制：15MB  
* **user** (string): 用户标识，由开发者定义规则，需保证用户标识在应用内唯一。

### **Response**

* text (string): 输出文字

### **Request**

curl \-X POST 'http://localhost/v1/audio-to-text' \\  
\--header 'Authorization: Bearer {api\_key}' \\  
\--form 'file=@localfile;type=audio/\[mp3|mp4|mpeg|mpga|m4a|wav|webm\]'

### **Response**

{  
  "text": "hello"  
}

## **POST /text-to-audio**

文字转语音。

### **Request Body**

* **message\_id** (str): Dify 生成的文本消息，那么直接传递生成的message-id 即可，后台会通过 message\_id 查找相应的内容直接合成语音信息。如果同时传 message\_id 和 text，优先使用 message\_id。  
* **text** (str): 语音生成内容。如果没有传 message-id的话，则会使用这个字段的内容  
* **user** (string): 用户标识，由开发者定义规则，需保证用户标识在应用内唯一。

### **Request**

curl \-o text-to-audio.mp3 \-X POST 'http://localhost/v1/text-to-audio' \\  
\--header 'Authorization: Bearer {api\_key}' \\  
\--header 'Content-Type: application/json' \\  
\--data-raw '{  
  "message\_id": "5ad4cb98-f0c7-4085-b384-88c403be6290",  
  "text": "Hello Dify",  
  "user": "abc-123",  
}'

### **headers**

{  
  "Content-Type": "audio/wav"  
}

## **GET /info**

获取应用基本信息。用于获取应用的基本信息。

### **Response**

* name (string): 应用名称  
* description (string): 应用描述  
* tags (array\[string\]): 应用标签

### **Request**

curl \-X GET 'http://localhost/v1/info' \\  
\-H 'Authorization: Bearer {api\_key}'

### **Response**

{  
  "name": "My App",  
  "description": "This is my app.",  
  "tags": \[  
    "tag1",  
    "tag2"  
  \],  
  "mode": "advanced-chat",  
  "author\_name": "Dify"  
}

## **GET /parameters**

获取应用参数。用于进入页面一开始，获取功能开关、输入参数名称、类型及默认值等使用。

### **Response**

* opening\_statement (string): 开场白  
* suggested\_questions (array\[string\]): 开场推荐问题列表  
* suggested\_questions\_after\_answer (object): 启用回答后给出推荐问题。  
  * enabled (bool): 是否开启  
* speech\_to\_text (object): 语音转文本  
  * enabled (bool): 是否开启  
* text\_to\_speech (object): 文本转语音  
  * enabled (bool): 是否开启  
  * voice (string): 语音类型  
  * language (string): 语言  
  * autoPlay (string): 自动播放  
    * enabled: 开启  
    * disabled: 关闭  
* retriever\_resource (object): 引用和归属  
  * enabled (bool): 是否开启  
* annotation\_reply (object): 标记回复  
  * enabled (bool): 是否开启  
* user\_input\_form (array\[object\]): 用户输入表单配置  
  * text-input (object): 文本输入控件  
    * label (string): 控件展示标签名  
    * variable (string): 控件 ID  
    * required (bool): 是否必填  
    * default (string): 默认值  
  * paragraph (object): 段落文本输入控件  
    * label (string): 控件展示标签名  
    * variable (string): 控件 ID  
    * required (bool): 是否必填  
    * default (string): 默认值  
  * select (object): 下拉控件  
    * label (string): 控件展示标签名  
    * variable (string): 控件 ID  
    * required (bool): 是否必填  
    * default (string): 默认值  
    * options (array\[string\]): 选项值  
* file\_upload (object): 文件上传配置  
  * document (object): 文档设置。支持类型：txt, md, markdown, pdf, html, xlsx, xls, docx, csv, eml, msg, pptx, ppt, xml, epub。  
    * enabled (bool): 是否启用  
    * number\_limits (int): 文档数量限制，默认为 3  
    * transfer\_methods (array\[string\]): 传输方式列表：remote\_url, local\_file，必须选择一个。  
  * image (object): 图片设置。支持类型：png, jpg, jpeg, webp, gif。  
    * enabled (bool): 是否启用  
    * number\_limits (int): 图片数量限制，默认为 3  
    * transfer\_methods (array\[string\]): 传输方式列表：remote\_url, local\_file，必须选择一个。  
  * audio (object): 音频设置。支持类型：mp3, m4a, wav, webm, amr。  
    * enabled (bool): 是否启用  
    * number\_limits (int): 音频数量限制，默认为 3  
    * transfer\_methods (array\[string\]): 传输方式列表：remote\_url, local\_file，必须选择一个。  
  * video (object): 视频设置。支持类型：mp4, mov, mpeg, mpga。  
    * enabled (bool): 是否启用  
    * number\_limits (int): 视频数量限制，默认为 3  
    * transfer\_methods (array\[string\]): 传输方式列表：remote\_url, local\_file，必须选择一个。  
  * custom (object): 自定义设置  
    * enabled (bool): 是否启用  
    * number\_limits (int): 自定义数量限制，默认为 3  
    * transfer\_methods (array\[string\]): 传输方式列表：remote\_url, local\_file，必须选择一个。  
* system\_parameters (object): 系统参数  
  * file\_size\_limit (int): Document upload size limit (MB)  
  * image\_file\_size\_limit (int): Image file upload size limit (MB)  
  * audio\_file\_size\_limit (int): Audio file upload size limit (MB)  
  * video\_file\_size\_limit (int): Video file upload size limit (MB)

### **Request**

curl \-X GET 'http://localhost/v1/parameters'

### **Response**

{  
  "introduction": "nice to meet you",  
  "user\_input\_form": \[  
    {  
      "text-input": {  
        "label": "a",  
        "variable": "a",  
        "required": true,  
        "max\_length": 48,  
        "default": ""  
      }  
    },  
    {  
      // ...  
    }  
  \],  
  "file\_upload": {  
    "image": {  
      "enabled": true,  
      "number\_limits": 3,  
      "transfer\_methods": \[  
        "remote\_url",  
        "local\_file"  
      \]  
    }  
  },  
  "system\_parameters": {  
    "file\_size\_limit": 15,  
    "image\_file\_size\_limit": 10,  
    "audio\_file\_size\_limit": 50,  
    "video\_file\_size\_limit": 100  
  }  
}

## **GET /meta**

获取应用Meta信息。用于获取工具 icon。

### **Response**

* tool\_icons (object\[string\]): 工具图标  
  * 工具名称 (string)  
    * icon (object|string)  
      * (object) 图标  
        * background (string): hex 格式的背景色  
        * content(string): emoji  
      * (string) 图标 URL

### **Request**

curl \-X GET 'http://localhost/v1/meta' \\  
\-H 'Authorization: Bearer {api\_key}'

### **Response**

{  
  "tool\_icons": {  
    "dalle2": "\[https://cloud.dify.ai/console/api/workspaces/current/tool-provider/builtin/dalle/icon\](https://cloud.dify.ai/console/api/workspaces/current/tool-provider/builtin/dalle/icon)",  
    "api\_tool": {  
      "background": "\#252525",  
      "content": "😁"  
    }  
  }  
}

## **GET /site**

获取应用 WebApp 设置。用于获取应用的 WebApp 设置。

### **Response**

* title (string): WebApp 名称  
* chat\_color\_theme (string): 聊天颜色主题，hex 格式  
* chat\_color\_theme\_inverted (bool): 聊天颜色主题是否反转  
* icon\_type (string): 图标类型，emoji-表情，image-图片  
* icon (string): 图标，如果是 emoji 类型，则是 emoji 表情符号，如果是 image 类型，则是图片 URL  
* icon\_background (string): hex 格式的背景色  
* icon\_url (string): 图标 URL  
* description (string): 描述  
* copyright (string): 版权信息  
* privacy\_policy (string): 隐私政策链接  
* custom\_disclaimer (string): 自定义免责声明  
* default\_language (string): 默认语言  
* show\_workflow\_steps (bool): 是否显示工作流详情  
* use\_icon\_as\_answer\_icon (bool): 是否使用 WebApp 图标替换聊天中的 🤖

### **Request**

curl \-X GET 'http://localhost/v1/site' \\  
\-H 'Authorization: Bearer {api\_key}'

### **Response**

{  
  "title": "My App",  
  "chat\_color\_theme": "\#ff4a4a",  
  "chat\_color\_theme\_inverted": false,  
  "icon\_type": "emoji",  
  "icon": "😄",  
  "icon\_background": "\#FFEAD5",  
  "icon\_url": null,  
  "description": "This is my app.",  
  "copyright": "all rights reserved",  
  "privacy\_policy": "",  
  "custom\_disclaimer": "All generated by AI",  
  "default\_language": "en-US",  
  "show\_workflow\_steps": false,  
  "use\_icon\_as\_answer\_icon": false  
}

## **GET /apps/annotations**

获取标注列表。

### **Query**

* **page** (string): 页码  
* **limit** (string): 每页数量

### **Request**

curl \--location \--request GET 'http://localhost/v1/apps/annotations?page=1\&limit=20' \\  
\--header 'Authorization: Bearer {api\_key}'

### **Response**

{  
  "data": \[  
    {  
      "id": "69d48372-ad81-4c75-9c46-2ce197b4d402",  
      "question": "What is your name?",  
      "answer": "I am Dify.",  
      "hit\_count": 0,  
      "created\_at": 1735625869  
    }  
  \],  
  "has\_more": false,  
  "limit": 20,  
  "total": 1,  
  "page": 1  
}

## **POST /apps/annotations**

创建标注。

### **Query**

* **question** (string): 问题  
* **answer** (string): 答案内容

### **Request**

curl \--location \--request POST 'http://localhost/v1/apps/annotations' \\  
\--header 'Authorization: Bearer {api\_key}' \\  
\--header 'Content-Type: application/json' \\  
\--data-raw '{  
  "question": "What is your name?",  
  "answer": "I am Dify."  
}'

### **Response**

{  
  "id": "69d48372-ad81-4c75-9c46-2ce197b4d402",  
  "question": "What is your name?",  
  "answer": "I am Dify.",  
  "hit\_count": 0,  
  "created\_at": 1735625869  
}

## **PUT /apps/annotations/{annotation\_id}**

更新标注。

### **Query**

* **annotation\_id** (string): 标注 ID  
* **question** (string): 问题  
* **answer** (string): 答案内容

### **Request**

curl \--location \--request PUT 'http://localhost/v1/apps/annotations/{annotation\_id}' \\  
\--header 'Authorization: Bearer {api\_key}' \\  
\--header 'Content-Type: application/json' \\  
\--data-raw '{  
  "question": "What is your name?",  
  "answer": "I am Dify."  
}'

### **Response**

{  
  "id": "69d48372-ad81-4c75-9c46-2ce197b4d402",  
  "question": "What is your name?",  
  "answer": "I am Dify.",  
  "hit\_count": 0,  
  "created\_at": 1735625869  
}

## **DELETE /apps/annotations/{annotation\_id}**

删除标注。

### **Query**

* **annotation\_id** (string): 标注 ID

### **Request**

curl \--location \--request DELETE 'http://localhost/v1/apps/annotations/{annotation\_id}' \\  
\--header 'Authorization: Bearer {api\_key}' \\  
\--header 'Content-Type: application/json'

### **Response**

204 No Content

## **POST /apps/annotation-reply/{action}**

标注回复初始设置。

### **Query**

* **action** (string): 动作，只能是 'enable' 或 'disable'  
* **embedding\_provider\_name** (string): 指定的嵌入模型提供商，必须先在系统内设定好接入的模型，对应的是 provider 字段  
* **embedding\_model\_name** (string): 指定的嵌入模型，对应的是 model 字段  
* **score\_threshold** (number): 相似度阈值，当相似度大于该阈值时，系统会自动回复，否则不回复

嵌入模型的提供商和模型名称可以通过以下接口获取：v1/workspaces/current/models/model-types/text-embedding，具体见：通过 API 维护知识库。使用的 Authorization 是 Dataset 的 API Token。

### **Request**

curl \--location \--request POST 'http://localhost/v1/apps/annotation-reply/{action}' \\  
\--header 'Authorization: Bearer {api\_key}' \\  
\--header 'Content-Type: application/json' \\  
\--data-raw '{  
  "score\_threshold": 0.9,  
  "embedding\_provider\_name": "zhipu",  
  "embedding\_model\_name": "embedding\_3"  
}'

### **Response**

{  
  "job\_id": "b15c8f68-1cf4-4877-bf21-ed7cf2011802",  
  "job\_status": "waiting"  
}

该接口是异步执行，所以会返回一个job\_id，通过查询job状态接口可以获取到最终的执行结果。

## **GET /apps/annotation-reply/{action}/status/{job\_id}**

查询标注回复初始设置任务状态。

### **Query**

* **action** (string): 动作，只能是 'enable' 或 'disable'，并且必须和标注回复初始设置接口的动作一致  
* **job\_id** (string): 任务 ID，从标注回复初始设置接口返回的 job\_id

### **Request**

curl \--location \--request GET 'http://localhost/v1/apps/annotation-reply/{action}/status/{job\_id}' \\  
\--header 'Authorization: Bearer {api\_key}'

### **Response**

{  
  "job\_id": "b15c8f68-1cf4-4877-bf21-ed7cf2011802",  
  "job\_status": "waiting",  
  "error\_msg": ""  
}  
