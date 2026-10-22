package com.hewei.hzyjy.xunzhi.interview.direct;

import com.hewei.hzyjy.xunzhi.common.config.storage.ApplicationStorageProperties;
import com.hewei.hzyjy.xunzhi.common.convention.exception.ClientException;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

/** Private resume storage; downloads must go through the existing ownership-checked API. */
@Component
@RequiredArgsConstructor
public class LocalResumeStore {
    private static final String PREFIX = "local-resume:";
    private static final int MAX_BYTES = 10 * 1024 * 1024;
    private final ApplicationStorageProperties storage;

    public boolean isLocal(String reference) {
        return reference != null && reference.startsWith(PREFIX);
    }

    public String save(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty() || file.getSize() > MAX_BYTES) {
            throw new ClientException("请上传不超过 10 MB 的 PDF 简历");
        }
        byte[] bytes = file.getBytes();
        extractText(bytes); // Reject unreadable/scanned files before calling the model.
        Path directory = storage.getBasePath().resolve("resumes");
        Files.createDirectories(directory);
        String name = UUID.randomUUID() + ".pdf";
        Files.write(directory.resolve(name), bytes);
        return PREFIX + name;
    }

    public byte[] read(String reference) throws IOException {
        if (!isLocal(reference) || !reference.substring(PREFIX.length())
                .matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.pdf")) {
            throw new ClientException("简历文件标识无效");
        }
        Path path = storage.getBasePath().resolve("resumes").resolve(reference.substring(PREFIX.length()));
        if (!Files.isRegularFile(path) || Files.size(path) > MAX_BYTES) {
            throw new ClientException("简历文件不存在，请重新上传");
        }
        return Files.readAllBytes(path);
    }

    public String text(String reference) throws IOException {
        return extractText(read(reference));
    }

    private String extractText(byte[] bytes) throws IOException {
        if (bytes.length < 5 || bytes[0] != '%' || bytes[1] != 'P' || bytes[2] != 'D'
                || bytes[3] != 'F' || bytes[4] != '-') {
            throw new ClientException("文件不是有效 PDF，请重新选择");
        }
        try (PDDocument document = Loader.loadPDF(bytes)) {
            if (document.isEncrypted() || document.getNumberOfPages() > 15) {
                throw new ClientException("请上传未加密且不超过 15 页的简历");
            }
            String text = new PDFTextStripper().getText(document).trim();
            if (text.length() < 30) {
                throw new ClientException("PDF 中可读取的文字不足，请上传可选中文字的简历；当前尚未接入扫描件 OCR");
            }
            return text.substring(0, Math.min(text.length(), 16000));
        } catch (ClientException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new ClientException("无法解析 PDF，请确认文件未损坏且未加密");
        }
    }
}
