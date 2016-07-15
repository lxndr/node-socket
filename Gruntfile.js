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
      dist: {
        entry: './src/client/client.js',
        output: {
          path: 'dist',
          filename: 'socket.js',
          libraryTarget: 'umd'
        },
        progress: true,
        stats: {
          errorDetails: true
        },
        module: {
          loaders: [{
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel'
          }]
        }
      }
    },

    uglify: {
      dist: {
        files: {
          'dist/socket.min.js': 'dist/socket.js'
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
    'webpack:dist',
    'uglify:dist'
  ]);

  grunt.registerTask('lint', ['eslint']);
  grunt.registerTask('test', ['mochaTest']);
};
