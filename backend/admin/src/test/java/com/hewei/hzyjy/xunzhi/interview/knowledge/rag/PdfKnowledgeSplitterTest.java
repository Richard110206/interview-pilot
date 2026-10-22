package com.hewei.hzyjy.xunzhi.interview.knowledge.rag;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PdfKnowledgeSplitterTest {
    @Test
    void simultaneousUploadsKeepTheirOwnPageCountsAndContent() throws Exception {
        PdfKnowledgeSplitter splitter = new PdfKnowledgeSplitter();
        List<byte[]> inputs = new ArrayList<>();
        for (int pages = 1; pages <= 8; pages++) {
            try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                for (int i = 0; i < pages; i++) {
                    PDPage page = new PDPage();
                    document.addPage(page);
                    try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                        content.beginText();
                        content.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                        content.newLineAtOffset(50, 700);
                        content.showText("Document " + pages + " has a distinct interview knowledge topic.");
                        content.endText();
                    }
                }
                document.save(output);
                inputs.add(output.toByteArray());
            }
        }
        var pool = Executors.newFixedThreadPool(8);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<?>> results = new ArrayList<>();
            for (int i = 0; i < 64; i++) {
                int expected = i % 8 + 1;
                results.add(pool.submit(() -> {
                    try {
                        start.await();
                        var result = splitter.split(inputs.get(expected - 1), null, 20, 800, 80);
                        assertEquals(expected, result.pages());
                        assertFalse(result.chunks().isEmpty());
                        assertTrue(result.chunks().stream().allMatch(c->c.pageStart()!=null && c.pageStart()>=1 && c.pageEnd()<=expected && c.pageEnd()>=c.pageStart()));
                        assertTrue(result.chunks().get(0).content().contains("Document " + expected));
                    } catch (InterruptedException ex) { Thread.currentThread().interrupt(); throw new RuntimeException(ex); }
                }));
            }
            start.countDown();
            for (Future<?> result : results) result.get(30, TimeUnit.SECONDS);
        } finally { pool.shutdownNow(); }
    }
}
