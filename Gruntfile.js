module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    clean: {
      files: [
        'dist',
        'lib'
      ]
    },

    eslint: {
      files: 'src/**/*.js'
    },

    mochaTest: {
      test: {
        src: 'tests/*.js',
        options: {
          reporter: 'spec',
          require: 'tests/support/node'
        }
      }
    },

    babel: {
      dist: {
        files: [{
          expand: true,
          cwd: 'src',
          src: '**/*.js',
          dest: 'lib'
        }]
      }
    },

    webpack: {
      options: {
        entry: './lib/client/client.js',
        progress: true,
        stats: {
          errorDetails: true
        }
      },
      es5: {
        output: {
          path: 'dist',
          filename: 'socket-es5.js',
          libraryTarget: 'umd'
        },
        module: {
          loaders: [{
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel',
            query: {
              presets: ['es2015'],
              plugins: [
                ['transform-runtime', {
                  polyfill: true
                }]
              ]
            }
          }]
        }
      },
      es6: {
        output: {
          path: 'dist',
          filename: 'socket-es6.js',
          libraryTarget: 'umd'
        },
        module: {
          loaders: [{
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel',
            query: {
              plugins: [
                ['transform-runtime', {
                  polyfill: false
                }]
              ]
            }
          }]
        }
      }
    },

    uglify: {
      dist: {
        files: {
          'dist/socket-es5.min.js': 'dist/socket-es5.js',
          'dist/socket-es6.min.js': 'dist/socket-es6.js'
        }
      },
      options: {
        screwIE8: true,
        mangle: true,
        compress: {
          dead_code: true
        }
      }
    }
  });

  grunt.registerTask('default', [
    'clean',
    'babel',
    'webpack:es5',
    'webpack:es6',
    'uglify'
  ]);

  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('test', ['mochaTest']);
};
