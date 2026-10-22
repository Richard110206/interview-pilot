package com.hewei.hzyjy.xunzhi.interview.project;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.hewei.hzyjy.xunzhi.common.convention.exception.ClientException;
import org.springframework.stereotype.Component;
import java.io.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.regex.*;
import java.util.zip.*;

/** Public GitHub snapshots only. Fixed outbound hosts, bounded reads, no checkout or code execution. */
@Component
public class GitHubRepositoryClient {
    private static final Pattern LINK = Pattern.compile("https://github\\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(?:/[^\\s<>\"`，。；）)]*)?");
    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NEVER).build();
    private static final java.util.concurrent.ScheduledExecutorService BODY_TIMEOUTS=java.util.concurrent.Executors.newSingleThreadScheduledExecutor(r->{var t=new Thread(r,"github-body-timeout");t.setDaemon(true);return t;});
    private static final Set<String> EXTENSIONS = Set.of("java","kt","go","py","js","jsx","ts","tsx","vue","c","h","cpp","hpp","cs","rs","rb","php","sql","md","xml","json","yml","yaml","properties");
    public record Link(String owner, String repo, String kind, List<String> tail) {
        public String url() { return "https://github.com/" + owner + "/" + repo; }
    }
    public record CodeFile(String path, String content) { }
    public record Snapshot(String repositoryUrl, String commitSha, String description, String language,
                           String scope, List<CodeFile> files, int eligibleFiles, int skippedFiles) { }

    public static Link parseMessage(String message) {
        if (message == null || message.isBlank() || message.length() > 6000) throw new ClientException("请发送一个有效的公开 GitHub 仓库链接，消息不超过6000字");
        Matcher matcher=LINK.matcher(message);
        if(!matcher.find()) throw new ClientException("请使用 https://github.com/用户名/仓库名 形式的公开仓库链接");
        String raw=matcher.group().replaceAll("[.,;!]+$", "");
        if(matcher.find()) throw new ClientException("一次请发送一个仓库链接，可在消息中说明负责的模块");
        URI uri=URI.create(raw);
        if(!"github.com".equals(uri.getHost()) || uri.getPort()!=-1 || uri.getUserInfo()!=null) throw new ClientException("仅支持 GitHub 官方仓库链接");
        String path=uri.getPath();
        List<String> parts=Arrays.stream(path.split("/")).filter(s->!s.isEmpty()).toList();
        if(parts.size()<2 || parts.stream().anyMatch(s->s.equals(".")||s.equals("..")||s.indexOf('\\')>=0||s.chars().anyMatch(Character::isISOControl))) throw new ClientException("仓库路径无效");
        String repo=parts.get(1).replaceFirst("\\.git$", "");
        if(repo.isBlank() || repo.equals(".") || repo.equals("..")) throw new ClientException("仓库名无效");
        String kind=parts.size()>2?parts.get(2):"";
        if(!kind.isEmpty() && (!Set.of("tree","blob").contains(kind)||parts.size()<4)) throw new ClientException("请提交仓库首页、目录或源文件链接，不能使用 Issues、Pull Request 页面");
        return new Link(parts.get(0),repo,kind,parts.size()>3?parts.subList(3,parts.size()):List.of());
    }

    public Snapshot fetch(Link link) throws Exception {
        // Resolve branch/path boundaries using advertised refs rather than probing invalid commit paths.
        if(!link.tail().isEmpty())return fetchViaGitRefs(link);
        JSONObject repo;
        try {repo=getJson("/repos/"+link.owner()+"/"+link.repo());}
        catch(RateLimited ex) {return fetchViaGitRefs(link);}
        if(repo.getBooleanValue("private")) throw new ClientException("当前仅支持公开仓库，私有仓库授权尚未接入");
        String ref=repo.getString("default_branch"),scope="";
        JSONObject commit=null;
        try {commit=getJson("/repos/"+link.owner()+"/"+link.repo()+"/commits/"+segment(ref));}
        catch(RateLimited ex){return fetchViaGitRefs(link);}
        String sha=commit.getString("sha");
        if(sha==null || !sha.matches("[a-fA-F0-9]{40,64}")) throw new ClientException("GitHub 未返回有效的源码版本");
        return download(link,sha,scope,repo.getString("description"),repo.getString("language"));
    }
    private Snapshot download(Link link,String sha,String scope,String description,String language) throws Exception {
        byte[] archive=get(URI.create("https://codeload.github.com/"+link.owner()+"/"+link.repo()+"/zip/"+sha),20*1024*1024);
        var files=readArchive(archive,scope,"blob".equals(link.kind()));
        if(files.isEmpty()) throw new ClientException("所选范围没有可读取的源代码或项目说明，请检查目录或文件链接");
        int eligible=files.size();
        files.sort(Comparator.comparingInt((CodeFile f)->priority(f.path())).thenComparing(CodeFile::path));
        List<CodeFile> selected=new ArrayList<>();int chars=0;
        for(var f:files) {if(selected.size()>=120 || chars+f.content().length()>2_000_000)continue;selected.add(f);chars+=f.content().length();}
        return new Snapshot(link.url(),sha,description,language,scope,List.copyOf(selected),eligible,eligible-selected.size());
    }
    private Snapshot fetchViaGitRefs(Link link) throws Exception {
        // Public smart-HTTP reference discovery needs neither a local Git process nor a user token.
        String advertisement=new String(get(URI.create(link.url()+".git/info/refs?service=git-upload-pack"),2*1024*1024),StandardCharsets.UTF_8);
        Matcher matcher=Pattern.compile("([a-f0-9]{40}) (HEAD|refs/(?:heads|tags)/[^\\x00\\r\\n]+)").matcher(advertisement);
        Map<String,String> refs=new LinkedHashMap<>();while(matcher.find())refs.put(matcher.group(2),matcher.group(1));
        String sha=refs.get("HEAD"),scope="";
        if(!link.tail().isEmpty()) {
            sha=null;
            for(int n=link.tail().size();n>=1;n--) {
                String ref=String.join("/",link.tail().subList(0,n));
                String candidate=refs.getOrDefault("refs/heads/"+ref,refs.getOrDefault("refs/tags/"+ref+"^{}",refs.get("refs/tags/"+ref)));
                if(candidate==null && ref.matches("[a-f0-9]{40}"))candidate=ref;
                if(candidate!=null){sha=candidate;scope=String.join("/",link.tail().subList(n,link.tail().size()));break;}
            }
        }
        if(sha==null)throw new ClientException("无法读取公开 Git 引用，请确认仓库和分支存在后重试");
        return download(link,sha,scope,"通过 GitHub 公开 Git 引用读取固定版本","");
    }
    private static int priority(String path) {
        String p=path.toLowerCase(Locale.ROOT);
        if(p.matches("(^|.*/)(readme[^/]*|pom.xml|package.json|go.mod|cargo.toml)$"))return 0;
        if(p.contains("/test/")||p.contains("/tests/")||p.endsWith("test.java"))return 3;
        if(p.endsWith(".md"))return 4;
        return p.matches(".*(service|controller|repository|mapper|handler|router|model|domain|auth).*" )?1:2;
    }
    static boolean eligible(String path) {
        String p=path.toLowerCase(Locale.ROOT);
        for(String part:p.split("/"))if(Set.of("node_modules","target","dist","build","vendor",".git",".github",".idea","coverage","__pycache__").contains(part))return false;
        String name=p.substring(p.lastIndexOf('/')+1);
        if(name.startsWith(".env")||name.contains("secret")||name.contains("credential")||name.contains("lock")||name.endsWith(".min.js")||name.endsWith(".d.ts"))return false;
        int dot=name.lastIndexOf('.');return dot>=0 && EXTENSIONS.contains(name.substring(dot+1)) || name.equals("go.mod");
    }
    static String redact(String content) {
        return Pattern.compile("(?s)-----BEGIN [^-]*PRIVATE KEY-----.*?-----END [^-]*PRIVATE KEY-----").matcher(content)
                .replaceAll(m->java.util.regex.Matcher.quoteReplacement("[已隐藏私钥]"+"\n".repeat((int)m.group().chars().filter(c->c=='\n').count())))
                .replaceAll("(?im)^([^\\r\\n]*(?:password|passwd|api[_-]?key|access[_-]?token|client[_-]?secret|authorization)[\"']?\\s*[=:][^\\r\\n]*)$", "[已隐藏可能包含凭据的行]");
    }
    static List<CodeFile> readArchive(byte[] archive,String scope,boolean singleFile) throws IOException {
        List<CodeFile> files=new ArrayList<>();long expanded=0;int entries=0;
        try(var zip=new ZipInputStream(new ByteArrayInputStream(archive))) {
            ZipEntry entry;byte[] buffer=new byte[8192];
            while((entry=zip.getNextEntry())!=null) {
                if(++entries>10000)throw new ClientException("仓库文件过多，请改用具体模块目录链接");
                String full=entry.getName();
                if(full.startsWith("/")||full.indexOf('\\')>=0||Arrays.asList(full.split("/")).contains(".."))throw new ClientException("源码归档包含不安全路径");
                int slash=full.indexOf('/');String path=slash<0?"":full.substring(slash+1);
                boolean inScope=scope.isEmpty()||(singleFile?path.equals(scope):path.startsWith(scope+"/"));
                boolean keep=!entry.isDirectory() && inScope && eligible(path);
                var bytes=new ByteArrayOutputStream();int length=0,n;
                while((n=zip.read(buffer))!=-1) {
                    expanded+=n;length+=n;
                    if(expanded>80L*1024*1024)throw new ClientException("仓库展开后过大，请改用较小项目");
                    if(keep && length<=256*1024)bytes.write(buffer,0,n);
                }
                if(keep && length>0 && length<=256*1024) {
                    String text=bytes.toString(StandardCharsets.UTF_8);
                    if(text.indexOf('\0')<0)files.add(new CodeFile(path,redact(text)));
                }
            }
        }
        return files;
    }
    private JSONObject getJson(String path) throws Exception {return JSON.parseObject(new String(get(URI.create("https://api.github.com"+path),2*1024*1024),StandardCharsets.UTF_8));}
    protected byte[] get(URI uri,int limit) throws Exception {
        if(!"https".equals(uri.getScheme())||!Set.of("api.github.com","codeload.github.com","github.com").contains(uri.getHost())||uri.getUserInfo()!=null||uri.getPort()!=-1)throw new ClientException("源码请求地址不允许");
        var request=HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(35)).header("Accept","application/vnd.github+json").header("Git-Protocol","version=1").header("User-Agent","Yingda-Interview/1.0").GET().build();
        var response=HTTP.send(request,HttpResponse.BodyHandlers.ofInputStream());
        var deadline=BODY_TIMEOUTS.schedule(()->{try{response.body().close();}catch(IOException ignored){}},35,java.util.concurrent.TimeUnit.SECONDS);
        try(InputStream stream=response.body()) {
            if(response.statusCode()==404)throw new NotFound();
            if(response.statusCode()==403||response.statusCode()==429)throw new RateLimited();
            if(response.statusCode()!=200)throw new ClientException("获取 GitHub 源码失败（HTTP "+response.statusCode()+"），请稍后重试");
            byte[] bytes=stream.readNBytes(limit+1);if(bytes.length>limit)throw new ClientException("仓库下载超过20MB或接口响应过大，请使用较小仓库");return bytes;
        } finally {deadline.cancel(false);}
    }
    private static String segment(String s){return URLEncoder.encode(s,StandardCharsets.UTF_8).replace("+","%20");}
    private static class NotFound extends ClientException {NotFound(){super("仓库不存在或不是公开仓库，请检查链接");}}
    private static class RateLimited extends ClientException {RateLimited(){super("GitHub 访问频率受限，请稍后重试");}}
}
