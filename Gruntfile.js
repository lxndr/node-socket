'use strict';

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    clean: [
      'dist',
      'lib'
    ],

    eslint: {
      files: 'src/**/*.js'
    },

    mochaTest: {
      test: {
        src: 'tests/*.js'
      }
    },

    babel: {
      dist: {
        files: [{
          expand: true,
          cwd: 'src',
          src: [
            '**/*.js',
            '!providers/localStorage.js',
            '!index.browser.js'
          ],
          dest: 'lib'
        }]
      },
      options: {
        plugins: [
          'transform-es2015-modules-commonjs'
        ]
      }
    },

    browserify: {
      dist: {
        files: {
          'dist/socket.js': 'src/client/index.js'
        }
      },
      options: {
        browserifyOptions: {
          standalone: 'config'
        },
        transform: [
          ['babelify', {
            presets: ['es2015'],
            plugins: [
              'lodash',
              'transform-runtime'
            ]
          }]
        ]
      }
    },

    uglify: {
      dist: {
        files: {
          'dist/config.min.js': 'dist/config.js'
        }
      },
      options: {
        screwIE8: true,
        compress: {
          dead_code: true
        }
      }
    }
  });

  grunt.registerTask('default', [
    'babel',
    'browserify',
    'uglify'
  ]);

  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('test', ['mochaTest']);
};
