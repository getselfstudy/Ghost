const config = require('../../../config'),
    {User} = require('../../../models/user'),
    {Session} = require('../../../models/session'),
    session = require('express-session'),
    SessionStore = require('./store'),
    {BadRequestError, UnauthorizedError, InternalServerError} = require('../../../lib/common/errors');

const createSession = function createSession(req, res, next) {
    if (!req.body) {
        return next(new BadRequestError());
    }
    const {username, password} = req.body;
    User.check({
        email: username,
        password
    }).then((user) => {
        req.session.user_id = user.id;
        res.sendStatus(201);
    }).catch((err) => {
        next(new UnauthorizedError(err.message));
    });
};

const destroySession = function destroySession(req, res, next) {
    req.session.destroy((err) => {
        if (err) {
            return next(new InternalServerError());
        }
        return res.sendStatus(204);
    });
};

const getUser = function getUser(req, res, next) {
    if (!req.session || !req.session.user_id) {
        req.user = null;
        return next();
    }
    User.findOne({id: req.session.user_id})
        .then((user) => {
            req.user = user;
            next();
        }).catch(() => {
            next(new UnauthorizedError('No user found'));
        });
};

const ensureUser = function ensureUser(req, res, next) {
    if (req.user && req.user.id) {
        return next();
    }
    next(new UnauthorizedError('Missing credentials'));
};

const getSession = session({
    store: new SessionStore(Session),
    secret: config.get('session-secret'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 184 * 7 * 24 * 60 * 60 * 1000, // number of days in second half of year
        httpOnly: true,
        path: '/ghost',
        sameSite: 'lax',
        secure: /^https:/.test(config.get('url'))
    }
});

module.exports.getSession = getSession;
module.exports.createSession = createSession;
module.exports.destroySession = destroySession;
module.exports.getUser = getUser;
module.exports.ensureUser = ensureUser;
