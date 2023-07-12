import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const year = new Date().getFullYear().toString();
const folderPath = path.join(__dirname, year);

if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath);
  console.log("文件夹已创建");
} else {
  console.log("文件夹已存在");
}

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.7; rv:11.0) Gecko/20100101 Firefox/11.0",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Encoding": "gzip,deflate,sdch",
  "Accept-Language": "zh-CN,zh;q=0.8",
};

const gitAddCommitPush = (date: string, filename: string) => {
  const cmdGitAdd = `git add ${path.join(folderPath, filename)}`;
  const cmdGitCommit = `git commit -m "${date}"`;
  const cmdGitPush = "git push -u origin master";

  exec(cmdGitAdd);
  exec(cmdGitCommit);
  exec(cmdGitPush);
};

const createMarkdown = (date: string, filename: string) => {
  fs.writeFileSync(path.join(folderPath, filename), `## ${date}\n`);
};

const scrape = async (language: string, filename: string) => {
  const isTrending = language === "";
  const url = `https://github.com/trending${isTrending ? "" : "/" + language}`;
  const response = await axios.get(url, { headers: HEADERS });
  const $ = cheerio.load(response.data);
  const items = $("div.Box article.Box-row");

  const menu = isTrending ? "trending" : language;
  let result = `\n#### ${menu}\n`;

  items.each((index, element) => {
    const title = $(element).find(".lh-condensed a").text().replace(/\s/g, "");
    const owner = $(element).find(".lh-condensed span.text-normal").text();
    const description = $(element).find("p.col-9").text();
    let url = $(element).find(".lh-condensed a").attr("href");
    url = "https://github.com" + url;
    let stars = $(element).find(".f6 a[href$=stargazers]").text().trim();
    result += `* [${title.trim()}](${url.trim()}):${description.trim()} ⭐${stars}\n`;
  });
  fs.appendFileSync(path.join(folderPath, filename), result);
  console.log(`finished: ${menu}`);
};

const job = async () => {
  const strdate = new Date()
    .toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "-");
  const filename = `${strdate}.md`;

  createMarkdown(strdate, filename);

  await scrape("", filename);
  await scrape("typescript", filename);
  await scrape("python", filename);
  await scrape("javascript", filename);
  await scrape("go", filename);
  await scrape("c++", filename);
  await scrape("java", filename);
  await scrape("html", filename);
  await scrape("markdown", filename);
  await scrape("swift", filename);

  gitAddCommitPush(strdate, filename);
};

job();
