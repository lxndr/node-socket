const path = require('path');

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

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
      options: {
        presets: [
          ['env', {
            targets: {
              node: 6
            }
          }]
        ],
        plugins: ['transform-object-rest-spread']
      },
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
        entry: './<%= pkg.webpack %>',
        resolve: {
          alias: {
            mixwith: 'mixwith/src/mixwith.js'
          }
        }
      },
      es5: {
        output: {
          path: path.resolve(__dirname, 'dist'),
          filename: 'socket-es5.js',
          libraryTarget: 'umd'
        },
        module: {
          rules: [{
            test: /\.js$/,
            include: [
              path.resolve(__dirname, 'node_modules/mixwith'),
              path.resolve(__dirname, 'src')
            ],
            use: [{
              loader: 'babel-loader',
              options: {
                babelrc: false,
                compact: false,
                presets: [
                  ['env', {
                    modules: false,
                    uglify: true,
                    targets: {
                      ie: 11
                    }
                  }]
                ],
                plugins: [
                  require('babel-plugin-transform-object-rest-spread'),
                  require('babel-plugin-transform-node-env-inline')
                ]
              }
            }]
          }]
        }
      }
    },

    uglify: {
      dist: {
        files: {
          'dist/socket-es5.min.js': 'dist/socket-es5.js'
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
    'uglify'
  ]);

  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('test', ['mochaTest']);
};
