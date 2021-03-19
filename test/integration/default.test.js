var assert = require("chai").assert;
var helpers = require('./integration_helpers');

describe("default languages", function() {

  it('react genenerated correctly', function(done) {
    helpers.compare('react', [''], function(err) {
      assert(err == null, err);
      done();
    });
  });

  it('react-material genenerated correctly', function(done) {
    helpers.compare('react', ['--theme=material'], function(err) {
      assert(err == null, err);
      done();
    });
  });

  it('react-ssr genenerated correctly', function(done) {
    helpers.compare('react', ['--ssr=true'], function(err) {
      assert(err == null, err);
      done();
    });
  });


  it('react-apollo genenerated correctly', function(done) {
    helpers.compare('react', ['--graphql=apollo'], function(err) {
      assert(err == null, err);
      done();
    });
  });

  it('react-apollo-ssr genenerated correctly', function(done) {
    helpers.compare('react', ['--graphql=apollo', '--ssr=true'], function(err) {
      assert(err == null, err);
      done();
    });
  });

  it('reflux genenerated correctly', function(done) {
    helpers.compare('react', ['--client=reflux'], function(err) {
      assert(err == null, err);
      done();
    });
  });

  it('reflux-material genenerated correctly', function(done) {
    helpers.compare('react', ['--client=reflux', '--theme=material'], function(err) {
      assert(err == null, err);
      done();
    });
  });

  it('reflux-ssr genenerated correctly', function(done) {
    helpers.compare('react', ['--client=reflux', '--ssr=true'], function(err) {
      assert(err == null, err);
      done();
    });
  });

  it('reflux-apollo genenerated correctly', function(done) {
    helpers.compare('react', ['--client=reflux', '--graphql=apollo'], function(err) {
      assert(err == null, err);
      done();
    });
  });

  it('reflux-apollo-ssr genenerated correctly', function(done) {
    helpers.compare('react', ['--client=reflux', '--graphql=apollo', '-ssr=true'], function(err) {
      assert(err == null, err);
      done();
    });
  });


  it('blaze genenerated correctly', function(done) {
    helpers.compare('react', ['--client=blaze'], function(err) {
      assert(err == null, err);
      done();
    });
  });
});
