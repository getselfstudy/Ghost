module.exports = {
    name: 'activity',
    type: 'dom',
    render: function (opts) {
        let converters = require('../converters');
        let payload = opts.payload;
        // convert markdown to HTML ready for insertion into dom
        let html = converters.mobiledocConverter.render(payload.mobiledoc || {});

        // use the SimpleDOM document to create a raw HTML section.
        // avoids parsing/rendering of potentially broken or unsupported HTML
        return opts.env.dom.createRawHTMLSection(html);
    }
};
