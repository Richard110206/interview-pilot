# 映答字体

界面正文使用 **MiSans**，由小米主导设计；本应用使用 MiSans 字体。官方来源 https://hyperos.mi.com/font/en/download/ ，归档 https://hyperos.mi.com/font-download/MiSans.zip 。许可全文见同目录 `MiSans-LICENSE.txt`。

`MiSansVF.woff2` 由官方可变 TTF 转为 WOFF2 网页压缩封装，保留字形、字重轴和元数据。字体本身不单独销售。

页面通过 `misans/font.css` 的互斥 unicode-range 按需加载：`ui.woff2` 约 256 KB，优先覆盖界面文字；`common.woff2` 约 2.64 MB，覆盖其余常用中文；少见字符才加载完整 `MiSansVF.woff2`。完整字形覆盖保留，普通页面不再默认下载完整字体。可用 `scripts/build-font-subsets.py` 重建，统计见 `misans/manifest.json`。

栏目标题使用 Noto Serif SC，`yingda-display.woff2` 包含当前界面标题字符；Noto 的 SIL OFL 许可见本目录既有许可文件。`interview-sans.woff2` 保留作动态文字缺字时的后备。
