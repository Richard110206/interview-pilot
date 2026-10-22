package com.hewei.hzyjy.xunzhi.interview.knowledge.rag;

import cn.hutool.core.util.StrUtil;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

/**
 * PDF 知识切分器：PDFBox 提取文本 → 按八股文常见结构（章节号/问答行）识别块边界 →
 * 断行合并 → 超长块滑窗细分、过短块并入相邻块。产出带标题的可检索知识块。
 */
@Component
public class PdfKnowledgeSplitter {

    /** 章节号开头：如 "1."、"2.3、"、"12、"，行较短视为标题。 */
    private static final Pattern SECTION_HEADING = Pattern.compile("^\\d{1,3}(\\.\\d{1,3}){0,2}[、.．\\s].{0,50}$");
    /** 中文章节：如 "第三章"、"第2节"。 */
    private static final Pattern CN_CHAPTER = Pattern.compile("^第[一二三四五六七八九十百\\d]{1,4}[章节课部分][^\\n]{0,40}$");
    /** 问答式问题行：以问号结尾且行较短。 */
    private static final Pattern QUESTION_LINE = Pattern.compile("^[^\\n]{2,70}[？？]\\s*$");
    /** Q 编号行：如 "Q1:"、"Q："。 */
    private static final Pattern Q_PREFIX = Pattern.compile("^Q\\d*[:：].{0,60}$");
    /** 纯页码行。 */
    private static final Pattern PAGE_NUMBER = Pattern.compile("^\\d{1,4}$");

    /** 切分产物：heading 为最近的小节标题或问题行。 */
    public record Chunk(String heading, String content, Integer pageStart, Integer pageEnd) {
        public Chunk(String heading, String content) { this(heading, content, null, null); }
    }

    /** 提取与切分结果：pages 为真实页数。 */
    public record SplitResult(int pages, List<Chunk> chunks) {
    }

    /**
     * 从 PDF 字节提取并切分。password 可为空。返回页数与按文档顺序的知识块。
     */
    public SplitResult split(byte[] pdfBytes, String password, int maxPages, int chunkSize, int overlap) {
        try (PDDocument doc = StrUtil.isBlank(password) ? Loader.loadPDF(pdfBytes) : Loader.loadPDF(pdfBytes,password)) {
            if(doc.getNumberOfPages()>maxPages) throw new IllegalArgumentException("文档超过最大页数限制");
            PDFTextStripper stripper=new PDFTextStripper();stripper.setSortByPosition(true);
            List<Chunk> result=new ArrayList<>();
            for(int page=1;page<=doc.getNumberOfPages();page++) {
                stripper.setStartPage(page);stripper.setEndPage(page);
                List<Chunk> blocks=splitOversized(mergeTinyBlocks(splitByBoundaries(stripper.getText(doc))),chunkSize,overlap);
                for(Chunk block:blocks) result.add(new Chunk(block.heading(),block.content(),page,page));
            }
            return new SplitResult(doc.getNumberOfPages(),result);
        } catch(IllegalArgumentException ex){throw ex;}
        catch(Exception ex){throw new IllegalArgumentException("PDF 解析失败",ex);}
    }

    private record ExtractedPdf(int pages, String text) {
    }

    /** 超过目标长度的块按窗口滑分，重叠部分保留上下文，尽量在句读处断开。 */
    private List<Chunk> splitOversized(List<Chunk> blocks, int chunkSize, int overlap) {
        List<Chunk> result = new ArrayList<>();
        for (Chunk block : blocks) {
            String content = block.content();
            if (content.length() <= chunkSize + 200) {
                result.add(block);
                continue;
            }
            int start = 0;
            int seq = 1;
            while (start < content.length()) {
                int end = Math.min(start + chunkSize, content.length());
                if (end < content.length()) {
                    // 在窗口尾部向后找句读，找不到再向前，避免硬切断句
                    int softEnd = lastSentenceEnd(content, start + (int) (chunkSize * 0.6), end + 80 > content.length() ? end : end);
                    if (softEnd > start) {
                        end = softEnd;
                    }
                }
                result.add(new Chunk(block.heading() + "（续" + seq + "）", content.substring(start, end).trim()));
                seq++;
                if (end >= content.length()) {
                    break;
                }
                start = Math.max(end - overlap, start + 1);
            }
        }
        return result;
    }

    private int lastSentenceEnd(String content, int from, int to) {
        for (int i = Math.min(to, content.length()) - 1; i > from; i--) {
            char c = content.charAt(i);
            if (c == '。' || c == '；' || c == '\n' || c == '.' || c == '!' || c == '？' || c == '?') {
                return i + 1;
            }
        }
        return -1;
    }

    private ExtractedPdf extract(byte[] pdfBytes, String password, int maxPages) {
        try (PDDocument doc = StrUtil.isBlank(password)
                ? Loader.loadPDF(pdfBytes)
                : Loader.loadPDF(pdfBytes, password)) {
            if (doc.getNumberOfPages() > maxPages) {
                throw new IllegalArgumentException("文档超过最大页数限制：" + doc.getNumberOfPages() + " > " + maxPages);
            }
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return new ExtractedPdf(doc.getNumberOfPages(), stripper.getText(doc));
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("PDF 解析失败：" + e.getMessage(), e);
        }
    }

    /** 逐行扫描：命中标题/问题模式则开启新块，其余行累积；同时做中文断行合并。 */
    private List<Chunk> splitByBoundaries(String text) {
        List<Chunk> blocks = new ArrayList<>();
        String currentHeading = null;
        StringBuilder current = new StringBuilder();
        for (String rawLine : text.split("\n")) {
            String line = rawLine.stripTrailing();
            if (line.isBlank() || PAGE_NUMBER.matcher(line.trim()).matches()) {
                continue;
            }
            String trimmed = line.trim();
            boolean boundary = SECTION_HEADING.matcher(trimmed).matches()
                    || CN_CHAPTER.matcher(trimmed).matches()
                    || QUESTION_LINE.matcher(trimmed).matches()
                    || Q_PREFIX.matcher(trimmed).matches();
            if (boundary && current.length() > 0) {
                blocks.add(new Chunk(StrUtil.nullToDefault(currentHeading, ""), current.toString().trim()));
                current.setLength(0);
            }
            if (boundary && currentHeading == null || boundary && isHeadingLike(trimmed)) {
                currentHeading = trimmed;
            }
            // 中文断行直接相连，英文数字行尾补空格，避免跨行单词粘连
            if (current.length() > 0 && !startsWithCjkPunct(trimmed)) {
                char prev = current.charAt(current.length() - 1);
                if (isAsciiWordChar(prev) && isAsciiWordChar(trimmed.charAt(0))) {
                    current.append(' ');
                }
            }
            current.append(trimmed).append('\n');
        }
        if (current.length() > 0) {
            blocks.add(new Chunk(StrUtil.nullToDefault(currentHeading, ""), current.toString().trim()));
        }
        return blocks;
    }

    private boolean isHeadingLike(String line) {
        return line.length() <= 60;
    }

    private boolean startsWithCjkPunct(String line) {
        char c = line.charAt(0);
        return ",.、；;：:）)]】》".indexOf(c) >= 0;
    }

    private boolean isAsciiWordChar(char c) {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9');
    }

    /** 过短块并入前块（保持顺序与上下文），仍过短的丢弃。 */
    private List<Chunk> mergeTinyBlocks(List<Chunk> blocks) {
        List<Chunk> merged = new ArrayList<>();
        for (Chunk block : blocks) {
            if (block.content().length() < 40) {
                if (!merged.isEmpty()) {
                    Chunk prev = merged.remove(merged.size() - 1);
                    merged.add(new Chunk(prev.heading(), prev.content() + "\n" + block.content()));
                    continue;
                }
                continue;
            }
            merged.add(block);
        }
        return merged;
    }
}
