package com.hewei.hzyjy.xunzhi.interview.direct;

import com.hewei.hzyjy.xunzhi.common.config.storage.ApplicationStorageProperties;
import com.hewei.hzyjy.xunzhi.common.convention.exception.ClientException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import java.io.ByteArrayOutputStream;
import java.nio.file.Path;
import static org.junit.jupiter.api.Assertions.*;

class LocalResumeStoreTest {
    @TempDir Path directory;

    @Test
    void extractsActualPdfTextPersistsBytesAndRejectsUnsafeReferences() throws Exception {
        ApplicationStorageProperties storage = new ApplicationStorageProperties();
        storage.setBaseDir(directory.toString());
        LocalResumeStore store = new LocalResumeStore(storage);
        byte[] pdf = pdf(true);
        String reference = store.save(new MockMultipartFile("resumePdf", "resume.pdf", "application/pdf", pdf));
        assertTrue(reference.startsWith("local-resume:"));
        assertArrayEquals(pdf, store.read(reference));
        assertTrue(store.text(reference).contains("Spring Boot"));
        assertThrows(ClientException.class, () -> store.read("local-resume:../../secrets.pdf"));
        assertThrows(ClientException.class, () -> store.save(new MockMultipartFile("resumePdf", "fake.pdf", "application/pdf", "not-a-pdf".getBytes())));
        assertThrows(ClientException.class, () -> store.save(new MockMultipartFile("resumePdf", "scan.pdf", "application/pdf", pdf(false))));
    }

    private byte[] pdf(boolean withText) throws Exception {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream bytes = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            document.addPage(page);
            if (withText) {
                try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                    stream.beginText();
                    stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                    stream.newLineAtOffset(40, 750);
                    stream.showText("Java developer: Spring Boot, MySQL, Redis, transactions and REST APIs.");
                    stream.endText();
                }
            }
            document.save(bytes);
            return bytes.toByteArray();
        }
    }
}
