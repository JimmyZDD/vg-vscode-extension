/*
 * @Author: zdd
 * @Date: 2023-06-01 15:12:03
 * @LastEditors: zdd
 * @LastEditTime: 2023-06-05 14:53:22
 * @FilePath: /vg-vscode-extension/src/swagger-generator/dart/index.ts
 * @Description: 
 */

import { Uri, window } from "vscode";
import { join, mkdirp, getRootPath, existsSync, writeFile } from "@root/util";
import { getSimpleData } from "../http";
import { SwaggerConfig, collectChinese } from "../utils";
import ModelGenerate from "./generate/model";
import RequestGenerate from "./generate/request";

export const genWebapiForDart = async (uri: Uri) => {


  try {
    let rootPath = getRootPath(undefined);
    if (!rootPath) throw Error('no root path');

    const { jsonUrl, outputDir } = await SwaggerConfig.instance.getConfig(rootPath);
    if (!jsonUrl) throw Error('no swagger jsonUrl');

    await generateCode(jsonUrl, join(rootPath, 'lib', outputDir));
    window.showInformationMessage(
      `Successfully Generated api directory`
    );
  } catch (error) {
    console.error(error);
    window.showErrorMessage(
      `Error:
        ${error instanceof Error ? error.message : JSON.stringify(error)}`
    );
  }
};

async function generateCode(jsonUrl: string, targetDirectory: string) {
  if (!existsSync(targetDirectory)) await mkdirp(targetDirectory);

  const values = await getSimpleData(jsonUrl);

  writeFile(
    targetDirectory.concat(`/swagger.json`),
    JSON.stringify(values, null, 4),
    'utf-8',
  );

  //收集所有中文
  let chineseList = collectChinese(values);

  const translationPath = targetDirectory.concat(`/translation.json`);
  // 拿到所有中英文映射对象
  let translateJson = await SwaggerConfig.instance.getTranslateInfo(chineseList, translationPath);

  // 把翻译的内容写入
  writeFile(
    translationPath,
    JSON.stringify(translateJson, null, 4),
    'utf-8',
  );

  SwaggerConfig.instance.addConfig({ rootPath: targetDirectory, swaggerVersion: Math.floor(values.swagger) as 2 | 3 });

  // 生成 model
  await new ModelGenerate(values.data).generateAllModel();
  await new RequestGenerate(values.paths).generateAllRequest();
}
