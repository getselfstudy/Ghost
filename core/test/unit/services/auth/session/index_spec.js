const sessionService = require('../../../../../server/services/auth/session'),
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
        it('checks the username and password from the body', function (done) {
            const req = fakeReq();
            req.body.username = 'AzureDiamond';
            req.body.password = 'hunter2';

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
});
