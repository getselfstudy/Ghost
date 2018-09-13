const crypto = require('crypto'),
    common = require('../../../../lib/common'),
    models = require('../../../../models'),
    createdMessage = 'Created Settings Key `session-secret`.',
    deletedMessage = 'Deleted Settings Key `session-secret`.';

module.exports.up = () => {
    models.Settings.findOne({key: 'session-secret'})
        .then((model) => {
            if (model) {
                common.logger.warn(createdMessage);
                return;
            }
            common.logger.info(createdMessage);
            return models.Settings.forge({
                key: 'session-secret',
                value: crypto.randomBytes(32).toString('hex')
            }).save();
        });
};

module.exports.down = () => {
    models.Settings.findOne({key: 'session-secret'})
        .then((model) => {
            if (!model) {
                common.logger.warn(deletedMessage);
                return;
            }
            common.logger.info(deletedMessage);
            return model.destroy();
        });
};

