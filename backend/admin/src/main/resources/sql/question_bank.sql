-- 题库表：智能面试出题的真题来源，配合 Redis 向量索引支持检索增强出题。
create table question_bank
(
    id               bigint auto_increment comment '主键ID'
        primary key,
    category         varchar(64)                          not null comment '岗位方向：Java后端/前端/测试等',
    skill_tag        varchar(64)                          not null comment '技能标签：集合/并发/JVM/Spring/MySQL/Redis/网络等',
    difficulty       tinyint                              not null default 2 comment '难度：1容易 2一般 3中等 4较难 5困难',
    question_type    varchar(32)                          not null default 'CONCEPT' comment '题型：CONCEPT概念 SCENARIO场景 CODING编码 PROJECT项目',
    question_text    varchar(2000)                        not null comment '题干',
    reference_answer text                                 null comment '参考答案',
    scoring_points   text                                 null comment '评分要点JSON数组，如["要点1","要点2"]',
    status           tinyint  default 1                   not null comment '状态：0禁用 1启用',
    source           varchar(128)                         null comment '来源说明，如常见校招真题/自录入',
    create_time      datetime default CURRENT_TIMESTAMP   null comment '创建时间',
    update_time      datetime default CURRENT_TIMESTAMP   null on update CURRENT_TIMESTAMP comment '更新时间',
    del_flag         tinyint  default 0                   not null comment '删除标记：0未删除 1已删除'
)
    comment '面试题库表' collate = utf8mb4_unicode_ci;

create index idx_question_bank_category
    on question_bank (category);

create index idx_question_bank_skill_tag
    on question_bank (skill_tag);

-- 种子真题：Java 后端校招常见考点，答案与评分要点供出题参考和评分智能体使用。
insert into question_bank (category, skill_tag, difficulty, question_type, question_text, reference_answer, scoring_points, source) values
('Java后端', '集合', 3, 'CONCEPT', 'HashMap 在 JDK 1.8 之后的底层结构是怎样的？为什么链表长度超过 8 且数组长度达到 64 时会转成红黑树？',
 'JDK 1.8 中 HashMap 由数组 + 链表 + 红黑树组成。通过 key 的 hashCode 经扰动函数（高 16 位异或低 16 位）确定桶下标，哈希冲突时形成链表；链表长度超过阈值 8 且数组长度达到 64 时转为红黑树，将最坏查询复杂度从 O(n) 降到 O(log n)，数组不足 64 时优先扩容。扩容阈值为容量 × 负载因子 0.75，容量保持 2 的幂以支持位运算取模。链表插入采用尾插法，避免 1.7 头插法在并发扩容时形成环形链表导致死循环。',
 '["数组+链表+红黑树的结构","扰动函数与桶下标计算","树化条件：链表超8且数组达64","红黑树降低最坏复杂度到O(log n)","扩容机制与2的幂容量"]', '常见校招真题'),
('Java后端', '集合', 2, 'CONCEPT', 'ArrayList 和 LinkedList 的区别是什么？各自适合什么场景？',
 'ArrayList 底层是动态数组，支持按索引 O(1) 随机访问，尾部追加均摊 O(1)，中间插入删除需要移动元素为 O(n)，默认容量 10，扩容为 1.5 倍。LinkedList 底层是双向链表，随机访问 O(n)，头尾插入删除 O(1)，额外维护前后指针内存开销大。读多写少用 ArrayList；频繁在头尾操作或当作队列/双端队列时用 LinkedList 或更优的 ArrayDeque。两者线程均不安全。',
 '["数组与链表底层结构差异","随机访问与插删复杂度对比","ArrayList扩容机制","适用场景选择","线程不安全性"]', '常见校招真题'),
('Java后端', '并发', 3, 'CONCEPT', 'synchronized 和 ReentrantLock 有什么区别？各自的适用场景是什么？',
 'synchronized 是 JVM 层面的内置锁，编译后通过 monitor 指令实现，JDK 1.6 后引入偏向锁、轻量级锁、重量级锁和锁升级优化，使用简单且自动释放，还支持锁粗化、锁消除优化。ReentrantLock 是 JDK 并发包下的显式锁，支持公平锁、可中断获取、超时获取 tryLock 和多条件变量 Condition，必须在 finally 中 unlock。需要高级特性（公平性、可中断、多条件）时用 ReentrantLock，一般场景优先 synchronized。',
 '["实现层面：JVM内置锁 vs JDK API","锁升级优化","公平锁/可中断/超时/Condition差异","释放方式差异","选型建议"]', '常见校招真题'),
('Java后端', '并发', 3, 'CONCEPT', '线程池的核心参数有哪些？任务提交后的执行流程是怎样的？',
 'ThreadPoolExecutor 七大参数：corePoolSize 核心线程数、maximumPoolSize 最大线程数、keepAliveTime 非核心线程空闲存活时间、unit 时间单位、workQueue 任务队列、threadFactory 线程工厂、handler 拒绝策略。执行流程：当前线程数小于 corePoolSize 时直接建核心线程执行；达到核心数后新任务入队列；队列满且线程数小于 maximumPoolSize 时创建非核心线程；线程数达到最大值且队列满则触发拒绝策略（AbortPolicy 抛异常、CallerRuns 调用者执行、Discard 丢弃、DiscardOldest 丢最老）。不建议直接用 Executors 快捷方法，避免无界队列或 Integer.MAX_VALUE 线程数导致 OOM。',
 '["七大参数完整说出","提交任务的四步执行流程","四种拒绝策略","为什么不用Executors","线程数配置的经验思路"]', '常见校招真题'),
('Java后端', '并发', 4, 'CONCEPT', 'ConcurrentHashMap 在 JDK 1.8 中是如何保证线程安全的？',
 'JDK 1.8 放弃分段锁，采用 CAS + synchronized：桶为空时通过 CAS 写入首节点；桶非空时 synchronized 锁住该桶的头节点，只锁单个桶，粒度更细并发度更高。查询不加锁，依赖 volatile 保证可见性（Node 的 val 和 next 为 volatile）。size 统计用 baseCount + CounterCell 分散计数（类似 LongAdder）避免热点。扩容支持多线程协助迁移，各线程认领迁移区间。key 和 value 都不允许为 null，避免并发下二义性。',
 '["CAS+synchronized替代分段锁","锁粒度到桶级别","volatile保证读可见性","CounterCell分散计数","多线程协助扩容与禁止null"]', '常见校招真题'),
('Java后端', 'JVM', 3, 'CONCEPT', 'JVM 运行时数据区包含哪些部分？各部分存放什么内容？',
 '线程私有：程序计数器（记录当前字节码行号，唯一不会 OOM）、虚拟机栈（栈帧存储局部变量表、操作数栈、动态链接、返回地址，可能 StackOverflowError）、本地方法栈（native 方法）。线程共享：堆（对象实例和数组，GC 主战场，分新生代 Eden/Survivor 和老年代）、方法区（类元信息、运行时常量池、JDK 1.8 后由元空间实现，使用本地内存）。另外还有直接内存，受机器内存限制。',
 '["程序计数器作用","虚拟机栈与栈帧结构","堆的分代结构","方法区与元空间演变","线程私有与共享的划分"]', '常见校招真题'),
('Java后端', 'JVM', 4, 'CONCEPT', '常见的垃圾收集器有哪些？G1 和 CMS 的主要区别是什么？',
 '经典组合：Serial/ParNew（单线程/多线程复制算法）、Parallel Scavenge + Parallel Old（吞吐量优先）、CMS（并发标记清除，低停顿）、G1（Garbage First，区域化分代）、JDK 11 后 ZGC 和 Shenandoah（亚毫秒停顿）。CMS：标记-清除算法，并发标记并发清除，产生浮动垃圾和内存碎片，已废弃。G1：将堆划为等大 Region，逻辑分代物理不分代，优先回收垃圾最多的 Region，可预测停顿时间，整体标记-整理局部复制无碎片。大堆（6G+）、需要可控停顿时选 G1。',
 '["各收集器代际与算法","CMS并发模型与三大问题","G1的Region模型与可预测停顿","G1与CMS核心差异","选型依据"]', '常见校招真题'),
('Java后端', 'Spring', 2, 'CONCEPT', 'Spring Bean 的生命周期是怎样的？',
 '实例化（反射调用构造器）→ 属性填充（依赖注入）→ Aware 回调（BeanNameAware/BeanFactoryAware/ApplicationContextAware）→ BeanPostProcessor 前置处理 → 初始化（@PostConstruct、InitializingBean 的 afterPropertiesSet、init-method）→ BeanPostProcessor 后置处理（AOP 代理通常在此生成）→ 使用 → 销毁（@PreDestroy、DisposableBean 的 destroy、destroy-method）。单例存于单例池，原型 Bean 不管理销毁。AOP 通过 BeanPostProcessor（AnnotationAwareAspectJAutoProxyCreator）在初始化后生成代理对象。',
 '["实例化与属性填充顺序","Aware回调时机","三种初始化方式与顺序","BeanPostProcessor与AOP代理生成时机","三种销毁回调"]', '常见校招真题'),
('Java后端', 'Spring', 3, 'CONCEPT', 'Spring 如何解决循环依赖？为什么需要三级缓存？',
 '通过三级缓存解决单例 setter/字段注入的循环依赖：一级缓存 singletonObjects 存成品 Bean，二级缓存 earlySingletonObjects 存早期暴露的半成品，三级缓存 singletonFactories 存 ObjectFactory。A 实例化后先将工厂放入三级缓存再填充属性，发现依赖 B 则创建 B，B 注入 A 时从三级缓存拿到 A 的早期引用（若 A 需要 AOP 则由工厂提前生成代理），B 完成后 A 继续完成。三级缓存的意义在于把代理对象的创建延迟到真正被依赖时，保证注入的和最终容器中的一致。构造器循环依赖和原型循环依赖无法解决，prototype 会直接抛 BeanCurrentlyInCreationException。',
 '["三级缓存各自作用","解决流程完整描述","三级缓存与AOP代理的关系","无法解决的情形","SpringBoot默认禁止循环依赖的演进"]', '常见校招真题'),
('Java后端', 'MySQL', 3, 'CONCEPT', '为什么 MySQL 的 InnoDB 选择 B+ 树做索引而不是哈希表或普通 B 树？',
 'B+ 树非叶子节点只存键不存数据，单页可容纳更多键，树更矮（3 层可支撑千万级），磁盘 IO 次数少；叶子节点用双向链表串联，范围查询和排序只需顺序扫描。哈希索引等值查询 O(1) 但不支持范围查询和排序，无法用于最左前缀匹配。普通 B 树每个节点都存数据导致树更高，且范围查询要中序回溯。InnoDB 主键索引为聚簇索引，叶子存整行数据；二级索引叶子存主键值，查询非索引列需回表，覆盖索引可避免回表。',
 '["非叶子节点不存数据的收益","树高与磁盘IO关系","叶子链表支持范围查询","与哈希/B树对比","聚簇索引/回表/覆盖索引"]', '常见校招真题'),
('Java后端', 'MySQL', 3, 'CONCEPT', '事务的隔离级别有哪些？InnoDB 默认级别下如何解决幻读？',
 '四个隔离级别：读未提交（脏读、不可重复读、幻读都存在）、读已提交（解决脏读）、可重复读（解决脏读和不可重复读，InnoDB 默认）、串行化（全解决，性能差）。InnoDB 在可重复读下通过 MVCC 解决快照读幻读（一致性视图，事务开始时生成 Read View，后续读不到新提交的行）；通过 next-key lock（记录锁 + 间隙锁）解决当前读幻读，锁定已存在记录及其间隙阻止插入。极端场景（先快照读后当前读同一范围）仍可能出现幻读。',
 '["四个级别与三类问题对应关系","MVCC与Read View机制","next-key lock组成与作用","快照读与当前读区别","默认级别的残留幻读场景"]', '常见校招真题'),
('Java后端', 'Redis', 3, 'CONCEPT', '什么是缓存穿透、击穿、雪崩？分别如何应对？',
 '穿透：查询不存在的数据，缓存和数据库都没有，请求全打到数据库。应对：布隆过滤器拦截不存在的 key、缓存空值并设短过期、接口层参数校验。击穿：某个热点 key 过期瞬间大量并发直达数据库。应对：互斥锁重建缓存（拿到锁的线程查库回填，其余等待）、热点 key 逻辑过期不设 TTL、多级缓存。雪崩：大量 key 同时过期或 Redis 宕机导致数据库被冲垮。应对：过期时间加随机抖动、集群高可用、限流降级熔断、多级缓存。',
 '["三者定义与区别","布隆过滤器/空值缓存","互斥锁与逻辑过期","随机TTL与集群高可用","限流降级兜底"]', '常见校招真题'),
('Java后端', '网络', 2, 'CONCEPT', 'TCP 三次握手和四次挥手的过程是怎样的？为什么握手是三次而挥手是四次？',
 '握手：客户端 SYN(seq=x) → 服务端 SYN+ACK(seq=y, ack=x+1) → 客户端 ACK(ack=y+1)。三次的原因：双方都需要确认收发能力，服务端把 SYN 和 ACK 合并成一次发送所以少一次。挥手：主动方 FIN → 被动方 ACK → 被动方 FIN → 主动方 ACK。四次原因：被动方收到 FIN 后可能还有数据要发，ACK 先回，等数据发完再发 FIN，不能合并。主动方最后 TIME_WAIT 等待 2MSL 保证最后的 ACK 可达且旧连接报文消逝。',
 '["握手三步序列号变化","三次不能是两次的原因","挥手四步与不能合并的原因","TIME_WAIT的2MSL意义"]', '常见校招真题'),
('Java后端', 'Redis', 4, 'SCENARIO', '线上出现缓存与数据库数据不一致，你有哪些保证一致性的方案？各自的代价是什么？',
 '常见方案：1）先更新数据库再删除缓存（Cache Aside，推荐主流）：不一致窗口小，但删除失败需配合重试队列或 binlog 订阅（Canal）兜底；2）延迟双删：更新库后删缓存，延迟几百毫秒再删一次，覆盖读旧值回填的窗口，延迟时间难精确；3）先删缓存再更新库：并发下容易把旧值重新载入，需配合延迟双删；4）订阅 binlog 异步删缓存：解耦、可靠，但引入组件复杂度。强一致需要分布式锁或直接读写库放弃缓存，性能代价大。一般业务选择最终一致 + 过期时间兜底。',
 '["Cache Aside模式与删除失败处理","延迟双删原理与缺陷","binlog订阅方案","强一致的代价","最终一致与TTL兜底"]', '常见场景题'),
('Java后端', '并发', 3, 'SCENARIO', '如果一个接口突然变慢，线程池队列快速堆积，你会怎么排查和处理？',
 '排查：看监控定位慢的环节（CPU、GC、线程池、下游依赖）；jstack 看线程状态是否大量 WAITING/BLOCKED 在锁或外部调用；看慢 SQL、下游服务 RT、连接池是否耗尽；GC 日志确认是否频繁 Full GC。线程池层面：确认队列类型是否无界（LinkedBlockingQueue 默认 Integer.MAX_VALUE 会堆积 OOM），核心/最大线程数与实际 CPU 密集或 IO 密集的匹配度。处理：设置有界队列与合理拒绝策略、参数调优、下游超时与熔断降级（resilience4j/sentinel）、异步化隔离、必要时快速失败保护整体。',
 '["监控与线程栈定位手段","无界队列堆积风险","线程数按CPU/IO密集配置","超时熔断降级","快速失败保护"]', '常见场景题');
