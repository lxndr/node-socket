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
        progress: true,
        stats: {
          errorDetails: true
        },
        resolve: {
          alias: {
            mixwith: 'mixwith/src/mixwith.js'
          }
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
            loader: 'babel',
            test: /\.js$/,
            include: [
              'src',
              'node_modules/mixwith'
            ],
            query: {
              babelrc: false,
              presets: ['es2015'],
              plugins: [
                'transform-async-to-generator',
                'transform-runtime'
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
            loader: 'babel',
            test: /\.js$/,
            include: [
              'src',
              'node_modules/mixwith'
            ],
            query: {
              babelrc: false,
              plugins: [
                'transform-es2015-modules-commonjs',
                'transform-async-to-generator',
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
    'webpack:es6',
    'uglify'
  ]);

  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('test', ['mochaTest']);
};
