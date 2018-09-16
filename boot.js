const url = require('url');

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
}

function run() {
    require('./index.js');
}

if (require.main === module) {
    run();
}

module.exports = {
    rewrite,
    run
};
