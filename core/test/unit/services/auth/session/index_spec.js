const sessionService = require('../../../../../server/services/auth/session'),
    SessionStore = require('../../../../../server/services/auth/session/store'),
    config = require('../../../../../server/config'),
    models = require('../../../../../server/models'),
    {BadRequestError, UnauthorizedError, InternalServerError} = require('../../../../../server/lib/common/errors'),
    sinon = require('sinon'),
    should = require('should');

describe('Session Service', function () {
    let sandbox;
    before(function () {
        models.init();
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });

    const fakeReq = function fakeReq() {
        return {
            session: {
                destroy() {}
            },
            body: {},
            get() {}
        };
    };

    const fakeRes = function fakeRes() {
        return {
            sendStatus() {}
        };
    };

    describe('createSession', function () {
        it('calls next with a BadRequestError if there is no body', function (done) {
            const req = fakeReq();
            delete req.body;
            sessionService.createSession(req, fakeRes(), function next(err) {
                should.equal(err instanceof BadRequestError, true);
                done();
            });
        });

        it('calls next with a BadRequestError if there is no Origin or Refferer', function (done) {
            const req = fakeReq();
            sandbox.stub(req, 'get')
                .withArgs('origin').returns('')
                .withArgs('referrer').returns('');

            sessionService.createSession(req, fakeRes(), function next(err) {
                should.equal(err instanceof BadRequestError, true);
                done();
            });
        });

        it('checks the username and password from the body', function (done) {
            const req = fakeReq();
            req.body.username = 'AzureDiamond';
            req.body.password = 'hunter2';

            sandbox.stub(req, 'get')
                .withArgs('origin').returns('http://host.tld');

            const checkStub = sandbox.stub(models.User, 'check')
                .resolves();

            sessionService.createSession(req, fakeRes(), function next() {
                const checkStubCall = checkStub.getCall(0);
                should.equal(checkStubCall.args[0].email, req.body.username);
                should.equal(checkStubCall.args[0].password, req.body.password);
                done();
            });
        });

        it('calls next with an UnauthorizedError if the check fails', function (done) {
            const req = fakeReq();
            const checkStub = sandbox.stub(models.User, 'check')
                .rejects();
            sandbox.stub(req, 'get')
                .withArgs('origin').returns('http://host.tld');

            sessionService.createSession(req, fakeRes(), function next(err) {
                should.equal(err instanceof UnauthorizedError, true);
                done();
            });
        });

        it('sets req.session.user_id and calls sendStatus with 201 if the check succeeds', function (done) {
            const req = fakeReq();
            const res = fakeRes();
            const checkStub = sandbox.stub(models.User, 'check')
                .resolves(models.User.forge({id: 23}));
            sandbox.stub(req, 'get')
                .withArgs('origin').returns('http://host.tld');

            const sendStatusStub = sandbox.stub(res, 'sendStatus')
                .callsFake(function (statusCode) {
                    should.equal(req.session.user_id, 23);
                    should.equal(statusCode, 201);
                    done();
                });

            sessionService.createSession(req, res);
        });
    });

    describe('destroySession', function () {
        it('calls req.session.destroy', function () {
            const req = fakeReq();
            const res = fakeRes();
            const destroyStub = sandbox.stub(req.session, 'destroy');

            sessionService.destroySession(req, res);

            should.equal(destroyStub.callCount, 1);
        });

        it('calls next with InternalServerError if destroy errors', function (done) {
            const req = fakeReq();
            const res = fakeRes();
            const destroyStub = sandbox.stub(req.session, 'destroy')
                .callsFake(function (fn) {
                    fn(new Error('oops'));
                });

            sessionService.destroySession(req, res, function next(err) {
                should.equal(err instanceof InternalServerError, true);
                done();
            });
        });

        it('calls sendStatus with 204 if destroy does not error', function (done) {
            const req = fakeReq();
            const res = fakeRes();
            const destroyStub = sandbox.stub(req.session, 'destroy')
                .callsFake(function (fn) {
                    fn();
                });
            const sendStatusStub = sandbox.stub(res, 'sendStatus')
                .callsFake(function (status) {
                    should.equal(status, 204);
                    done();
                });

            sessionService.destroySession(req, res);
        });
    });

    describe('getUser', function () {
        it('sets req.user to null and calls next if there is no session', function (done) {
            const req = fakeReq();
            const res = fakeRes();

            delete req.session;

            sessionService.getUser(req, res, function next() {
                should.equal(req.user, null);
                done();
            });
        });

        it('sets req.user to null and calls next if there is no session', function (done) {
            const req = fakeReq();
            const res = fakeRes();

            sessionService.getUser(req, res, function next() {
                should.equal(req.user, null);
                done();
            });
        });

        it('calls User.findOne with id set to req.session.user_id', function (done) {
            const req = fakeReq();
            const res = fakeRes();
            const findOneStub = sandbox.stub(models.User, 'findOne')
                .callsFake(function (opts) {
                    should.equal(opts.id, 23);
                    done();
                });

            req.session.user_id = 23;
            sessionService.getUser(req, res);
        });

        it('calls next with UnauthorizedError if the user is not found', function (done) {
            const req = fakeReq();
            const res = fakeRes();
            const findOneStub = sandbox.stub(models.User, 'findOne')
                .rejects();

            req.session.user_id = 23;
            sessionService.getUser(req, res, function next(err) {
                should.equal(err instanceof UnauthorizedError, true);
                done();
            });
        });

        it('calls next after settign req.user to the found user', function (done) {
            const req = fakeReq();
            const res = fakeRes();
            const user = models.User.forge({id: 23});
            const findOneStub = sandbox.stub(models.User, 'findOne')
                .resolves(user);

            req.session.user_id = 23;
            sessionService.getUser(req, res, function next() {
                should.equal(req.user, user);
                done();
            });
        });
    });

    describe('ensureUser', function () {
        it('calls next with no error if req.user.id exists', function (done) {
            const req = fakeReq();
            const res = fakeRes();
            const user = models.User.forge({id: 23});
            req.user = user;

            sessionService.ensureUser(req, res, function next(err) {
                should.equal(err, null);
                done();
            });
        });

        it('calls next with UnauthorizedError if req.user.id does not exist', function (done) {
            const req = fakeReq();
            const res = fakeRes();

            sessionService.ensureUser(req, res, function next(err) {
                should.equal(err instanceof UnauthorizedError, true);
                done();
            });
        });
    });

    describe('getSession', function () {
        let expressSessionStub;
        let expressSessionStubReturnValue;
        let mockedSessionService;
        beforeEach(function () {
            expressSessionStubReturnValue = {};
            expressSessionStub = sandbox.stub()
                .returns(expressSessionStubReturnValue);

            delete require.cache[require.resolve('../../../../../server/services/auth/session')];
            require.cache[require.resolve('express-session')].exports = expressSessionStub;
            mockedSessionService = require('../../../../../server/services/auth/session');
        });
        after(function () {
            delete require.cache[require.resolve('../../../../../server/services/auth/session')];
            delete require.cache[require.resolve('express-session')];
        });
        it('is an "instance" of express-session', function () {
            should.equal(mockedSessionService.getSession, expressSessionStubReturnValue);
        });

        it('uses an instance of SessionStore', function () {
            const options = expressSessionStub.getCall(0).args[0];
            should.equal(options.store instanceof SessionStore, true);
        });

        it('uses the session-secret config', function () {
            const options = expressSessionStub.getCall(0).args[0];
            should.equal(options.secret, config.get('session-secret'));
        });

        it('sets resave to false', function () {
            const options = expressSessionStub.getCall(0).args[0];
            should.equal(options.resave, false);
        });

        it('sets saveUninitialized to false', function () {
            const options = expressSessionStub.getCall(0).args[0];
            should.equal(options.saveUninitialized, false);
        });

        it('sets the cookies maxAge to 184 days', function () {
            const options = expressSessionStub.getCall(0).args[0];
            should.equal(options.cookie.maxAge, 184 * 24 * 60 * 60 * 1000);
        });

        it('sets the cookies httpOnly to true', function () {
            const options = expressSessionStub.getCall(0).args[0];
            should.equal(options.cookie.httpOnly, true);
        });

        it('sets the cookies path to /ghost', function () {
            const options = expressSessionStub.getCall(0).args[0];
            should.equal(options.cookie.path, '/ghost');
        });

        it('sets the cookies sameSite to "lax"', function () {
            const options = expressSessionStub.getCall(0).args[0];
            should.equal(options.cookie.sameSite, 'lax');
        });

        it('sets the cookies secure true if url config is https', function () {
            const options = expressSessionStub.getCall(0).args[0];
        });

        it('sets the cookies secure false if url config is http', function () {
            const options = expressSessionStub.getCall(0).args[0];
        });
    });

    describe('CSRF protection', function () {
        it('calls next if the session is uninitialized', function (done) {
            const req = fakeReq();
            const res = fakeRes();

            sessionService.cookieCsrfProtection(req, res, function next(err) {
                should.not.exist(err);
                done();
            });
        });

        it('calls next if req origin matches the session origin', function (done) {
            const req = fakeReq();
            const res = fakeRes();
            sandbox.stub(req, 'get')
                .withArgs('origin').returns('http://host.tld');
            req.session.origin = 'http://host.tld';

            sessionService.cookieCsrfProtection(req, res, function next(err) {
                should.not.exist(err);
                done();
            });
        });

        it('calls next with BadRequestError if the origin of req does not match the session', function (done) {
            const req = fakeReq();
            const res = fakeRes();
            sandbox.stub(req, 'get')
                .withArgs('origin').returns('http://host.tld');
            req.session.origin = 'http://different-host.tld';

            sessionService.cookieCsrfProtection(req, res, function next(err) {
                should.equal(err instanceof BadRequestError, true);
                done();
            });
        });
    });

    describe('safeGetSession', function () {
        it('is an array of getSession and cookieCsrfProtection', function () {
            should.deepEqual(sessionService.safeGetSession, [
                sessionService.getSession,
                sessionService.cookieCsrfProtection
            ]);
        });
    });
});