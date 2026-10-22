package com.hewei.hzyjy.xunzhi.interview.project;

import com.hewei.hzyjy.xunzhi.common.convention.exception.ClientException;
import com.hewei.hzyjy.xunzhi.interview.execution.InterviewExecutionTrace;
import com.hewei.hzyjy.xunzhi.interview.flow.session.InterviewSessionFacade;
import com.hewei.hzyjy.xunzhi.interview.service.InterviewSessionService;
import com.hewei.hzyjy.xunzhi.interview.project.InterviewProjectStore.ImportJob;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.*;

/** Network import is independent of the AI timeout; generation still uses the normal guarded extraction. */
@Service @RequiredArgsConstructor
public class InterviewProjectImportService {
    private final InterviewProjectStore store;
    private final GitHubRepositoryClient github;
    private final InterviewSessionService sessions;
    private final InterviewSessionFacade facade;
    private final InterviewExecutionTrace trace;
    private final com.hewei.hzyjy.xunzhi.interview.direct.DirectInterviewProperties direct;
    private final ExecutorService imports=new ThreadPoolExecutor(2,2,30,TimeUnit.SECONDS,new ArrayBlockingQueue<>(8),r->{var t=new Thread(r,"github-project-import");t.setDaemon(true);return t;},new ThreadPoolExecutor.AbortPolicy());

    public ImportJob submit(String session,Long user,String username,String message) {
        var owned=sessions.requireOwnedSession(session,user);
        if(Set.of("FINISHED","ABANDONED","RESUME_UPLOADING").contains(owned.getStatus()))throw new ClientException("当前会话不能接收项目链接，请等待处理完成或开始新面试");
        if(!direct.isEnabled())throw new ClientException("源码面试需要启用 Java 直连面试模式");
        var link=GitHubRepositoryClient.parseMessage(message);var job=store.claim(session,user,message,"DRAFT".equals(owned.getStatus()));
        if(store.dispatch(job)) {
            job.setStatus("FETCHING");
            try { imports.execute(()->run(job,link,username)); }
            catch(RejectedExecutionException ex){store.status(job,"FAILED","项目读取队列繁忙，请稍后重新发送链接");}
        }
        return store.read(session);
    }
    public ImportJob read(String session,Long user) {
        sessions.requireOwnedSession(session,user);var job=store.read(session);
        if(job!=null&&InterviewProjectStore.busy(job)&&job.getUpdatedAt()<System.currentTimeMillis()-600000)store.status(job,"FAILED","上次读取中断，请重新发送相同链接重试");
        return job;
    }
    private void run(ImportJob job,GitHubRepositoryClient.Link link,String username) {
        var span=trace.start(job.getId(),"retrieval","读取项目源码","GitHub 官方只读下载");
        try {
            var snapshot=github.fetch(link);store.status(job,"INDEXING",null);store.saveSnapshot(job,snapshot);
            trace.finish(span,"COMPLETED",job.getFileCount(),List.of(snapshot.repositoryUrl()+" @ "+snapshot.commitSha().substring(0,12)),"已按容量索引源文件，未执行项目代码");
            var current=sessions.requireOwnedSession(job.getId(),job.getUserId());
            var latest=store.read(job.getId());
            if(latest==null||!job.getJobId().equals(latest.getJobId()))return;
            if(Set.of("FINISHED","ABANDONED").contains(current.getStatus()))throw new ClientException("面试已结束，项目未继续用于出题");
            if("DRAFT".equals(current.getStatus())) {
                store.status(job,"GENERATING",null);
                facade.extractProjectQuestions(job.getId(),job.getUserId(),username,snapshot.commitSha()+"|"+job.getMessageHash());job.setQuestionsPrepared(true);
            }
            store.status(job,"READY",null);
        } catch(Exception ex) {
            trace.finish(span,"FAILED",null,List.of(),"项目导入或出题未完成，可以重试");
            store.status(job,"FAILED",ex instanceof ClientException?ex.getMessage():"项目读取未完成，请检查 GitHub 访问情况后重新发送链接");
        }
    }
    @PreDestroy void close(){imports.shutdownNow();}
}
