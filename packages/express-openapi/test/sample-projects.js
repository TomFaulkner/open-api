var expect = require('chai').expect;
var fs = require('fs');
var glob = require('glob');
var path = require('path');
var request = require('supertest');

describe(require('../package.json').name + 'sample-projects', function() {
  describe('configuring middleware', function() {
    var coercionMissingBody = {
      errors: [
        {
          errorCode: 'type.openapi.validation',
          location: 'path',
          message: 'should be integer',
          path: 'id'
        }
      ],
      status: 400
    };

    [
      // adding additional middleware
      {name: 'with-additional-middleware', url: '/v3/users/34?name=fred',
          expectedStatus: 200, expectedBody: {
            orderingApiDoc: 'pathModule',
            apiDocAdded: true,
            pathDocAdded: true,
            pathModuleAdded: true
          }},

      // not inheriting additional middleware
      {name: 'with-inherit-additional-middleware-false-at-methodDoc', url: '/v3/users/34?name=fred',
          expectedStatus: 200, expectedBody: {
            apiDocAdded: null,
            pathDocAdded: null,
            pathModuleAdded: null
          }},
      {name: 'with-inherit-additional-middleware-false-at-pathDoc', url: '/v3/users/34?name=fred',
          expectedStatus: 200, expectedBody: {
            apiDocAdded: null,
            pathDocAdded: true,
            pathModuleAdded: true
          }},
      {name: 'with-inherit-additional-middleware-false-at-pathModule', url: '/v3/users/34?name=fred',
          expectedStatus: 200, expectedBody: {
            apiDocAdded: null,
            pathDocAdded: null,
            pathModuleAdded: true
          }},

      // disable coercion
      {name: 'with-coercion-middleware-disabled-in-methodDoc', url: '/v3/users/34?name=fred',
          expectedStatus: 400, expectedBody: coercionMissingBody},
      {name: 'with-coercion-middleware-disabled-in-pathItem', url: '/v3/users/34?name=fred',
          expectedStatus: 400, expectedBody: coercionMissingBody},
      {name: 'with-coercion-middleware-disabled-in-pathModule', url: '/v3/users/34?name=fred',
          expectedStatus: 400, expectedBody: coercionMissingBody},
      {name: 'with-coercion-middleware-disabled-in-the-apiDoc', url: '/v3/users/34?name=fred',
          expectedStatus: 400, expectedBody: coercionMissingBody},

      // disable defaults
      {name: 'with-defaults-middleware-disabled-in-methodDoc', url: '/v3/users/34?name=fred',
          expectedStatus: 200, expectedBody: {id: 34, name: 'fred'}},
      {name: 'with-defaults-middleware-disabled-in-pathItem', url: '/v3/users/34?name=fred',
          expectedStatus: 200, expectedBody: {id: 34, name: 'fred'}},
      {name: 'with-defaults-middleware-disabled-in-pathModule', url: '/v3/users/34?name=fred',
          expectedStatus: 200, expectedBody: {id: 34, name: 'fred'}},
      {name: 'with-defaults-middleware-disabled-in-the-apiDoc', url: '/v3/users/34?name=fred',
          expectedStatus: 200, expectedBody: {id: 34, name: 'fred'}},

      // disable validation
      {name: 'with-validation-middleware-disabled-in-methodDoc', url: '/v3/users/asdf?name=fred',
          expectedStatus: 200, expectedBody: {age: 80, id: null, name: 'fred'}},
      {name: 'with-validation-middleware-disabled-in-pathItem', url: '/v3/users/asdf?name=fred',
          expectedStatus: 200, expectedBody: {age: 80, id: null, name: 'fred'}},
      {name: 'with-validation-middleware-disabled-in-pathModule', url: '/v3/users/asdf?name=fred',
          expectedStatus: 200, expectedBody: {age: 80, id: null, name: 'fred'}},
      {name: 'with-validation-middleware-disabled-in-the-apiDoc', url: '/v3/users/asdf?name=fred',
          expectedStatus: 200, expectedBody: {age: 80, id: null, name: 'fred'}},

      // disable all
      {name: 'with-middleware-disabled-in-methodDoc', url: '/v3/users/asdf?name=fred',
          expectedStatus: 200, expectedBody: {id: 'asdf', name: 'fred'}},
      {name: 'with-middleware-disabled-in-pathItem', url: '/v3/users/asdf?name=fred',
          expectedStatus: 200, expectedBody: {id: 'asdf', name: 'fred'}},
      {name: 'with-middleware-disabled-in-pathModule', url: '/v3/users/asdf?name=fred',
          expectedStatus: 200, expectedBody: {id: 'asdf', name: 'fred'}},
      {name: 'with-middleware-disabled-in-the-apiDoc', url: '/v3/users/asdf?name=fred',
          expectedStatus: 200, expectedBody: {id: 'asdf', name: 'fred'}}
    ].forEach(function(test) {
      describe(test.name, function() {
        var app;

        before(function() {
          app = require('./sample-projects/' + test.name + '/app.js');
        });

        it('should meet expectations', function(done) {
          request(app)
            .get(test.url)
            .expect(test.expectedStatus)
            .end(function(err, res) {
              expect(res.body).to.eql(test.expectedBody);
              done(err);
            });
        });
      });
    });

    [
      // disable response validation
      {name: 'with-response-validation-middleware-disabled-in-methodDoc',
          url: '/v3/users/34?name=fred', expectedStatus: 200, expectedBody: true},
      {name: 'with-response-validation-middleware-disabled-in-pathItem',
          url: '/v3/users/34?name=fred', expectedStatus: 200, expectedBody: true},
      {name: 'with-response-validation-middleware-disabled-in-pathModule',
          url: '/v3/users/34?name=fred', expectedStatus: 200, expectedBody: true},
      {name: 'with-response-validation-middleware-disabled-in-the-apiDoc',
          url: '/v3/users/34?name=fred', expectedStatus: 200, expectedBody: true}
    ].forEach(function(test) {
      describe(test.name, function() {
        var app;

        before(function() {
          app = require('./sample-projects/' + test.name + '/app.js');
        });

        it('should not expose res.validateResponse in the app', function(done) {
          request(app)
            .get(test.url)
            .expect(test.expectedStatus)
            .end(function(err, res) {
              expect(res.body).to.eql(test.expectedBody);
              done(err);
            });
        });
      });
    });
  });

  glob.sync('./sample-projects/*', {cwd: __dirname}).forEach(function(sampleProjectPath) {
    var specName = path.basename(sampleProjectPath);
    var specPath = path.resolve(__dirname, sampleProjectPath, 'spec.js');

    if (fs.existsSync(specPath)) {
      describe(specName, function() {
        require(specPath);
      });
    }
  });
});
