import { execSync } from "child_process";

export const command: string = "process";
export const desc: string = "Processes all downloaded illustrations";

export const handler = async (): Promise<void> => {
  const illustrationsPath = `${__dirname}/../../illustrations`;

  // For each file in illustrations folder get the file name and run imagemagick script
  execSync(
    `for file in ${illustrationsPath}/*; do magick $file -trim -resize 512x512 -background white -gravity center -extent 512x512 $file; done`
  );

  // Zip all files in illustrations folder
  execSync(`cd ${illustrationsPath} && zip -r illustrations.zip *`);

  process.exit(0);
};
