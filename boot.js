const url = require('url');
const fs = require('fs');
const path = require('path');

function rewrite() {
    const dbURL = url.parse(process.env.JAWSDB_URL);

    const {auth, hostname, pathname} = dbURL;
    const [user, password] = auth.split(':');
    process.env.database__client = 'mysql';
    process.env.database__connection__host = hostname;
    process.env.database__connection__user = user;
    process.env.database__connection__password = password;
    process.env.database__connection__database = pathname.replace(/^\//, '');

    process.env.mail__transport = 'SMTP';
    process.env.mail__options__host = process.env.SPARKPOST_SMTP_HOST;
    process.env.mail__options__port = process.env.SPARKPOST_SMTP_PORT;
    process.env.mail__options__user = process.env.SPARKPOST_SMTP_USERNAME;
    process.env.mail__options__password = process.env.SPARKPOST_SMTP_PASSWORD;

    const key = JSON.parse(process.env.GS_KEY);
    const keyFile = path.resolve(__dirname, './.key.json');
    fs.writeFileSync(keyFile, process.env.GS_KEY);

    process.env.storage__active = 'gcloud';
    process.env.storage__gcloud__projectId = key.project_id;
    process.env.storage__gcloud__key = keyFile;
    process.env.storage__gcloud__bucket = process.env.GS_BUCKET;
    process.env.storage__gcloud__assetDomain = process.env.GS_DOMAIN || process.env.GS_BUCKET;

    // process.env.storage__active = "cloudinary";
    // process.env.storage__cloudinary__userDatedFolder = '';
    // process.env.storage__cloudinary__auth__cloud_name = process.env.CLOUDINARY_NAME;
    // process.env.storage__cloudinary__auth__api_key = process.env.CLOUDINARY_KEY;
    // process.env.storage__cloudinary__auth__api_secret = process.env.CLOUDINARY_SECRET;
    // process.env.storage__cloudinary__upload__use_filename = 'true';
    // process.env.storage__cloudinary__upload__unique_filename = '';
    // process.env.storage__cloudinary__upload__overwrite = '';
    // process.env.storage__cloudinary__upload__folder = process.env.CLOUDINARY_FOLDER;
    // process.env.storage__cloudinary__upload__tags = process.env.CLOUDINARY_TAGS || process.env.CLOUDINARY_FOLDER;
    // process.env.storage__cloudinary__fetch__quality = 'auto';
    // process.env.storage__cloudinary__fetch__secure = 'true';
    // process.env.storage__cloudinary__fetch__cdn_subdomain = 'true';
    // process.env.storage__cloudinary__rjs__baseWidth = '960';
    // process.env.storage__cloudinary__rjs__fireForget = 'true';
}

function run() {
    require('dotenv').config();

    rewrite();
    
    require('./index.js');
}

if (require.main === module) {
    run();
}

module.exports = {
    rewrite,
    run
};
