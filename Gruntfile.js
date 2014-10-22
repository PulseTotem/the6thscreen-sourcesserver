module.exports = function (grunt) {
    'use strict';

    // load extern tasks
    grunt.loadNpmTasks('grunt-express-server');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-typescript');

    // tasks
    grunt.initConfig({



// ---------------------------------------------
//                          build and dist tasks
// ---------------------------------------------
        typescript: {
            build: {
                src: [
                    'app/scripts/The6thScreenSourcesServer.ts'
                ],
                dest: 'build/js/The6thScreenSourcesServer.js',
                options: {
                    module: 'commonjs',
                    basePath: 'app/scripts'
                }
            },
            dist: {
                src: [
                    'app/scripts/The6thScreenSourcesServer.ts'
                ],
                dest: 'dist/js/The6thScreenSourcesServer.js',
                options: {
                    module: 'commonjs',
                    basePath: 'app/scripts'
                }
            }
        },

        express: {
            options: {
                port: 5000
            },
            build: {
                options: {
                    script: 'build/js/The6thScreenSourcesServer.js'
                }
            },
            dist: {
                options: {
                    script: 'dist/js/The6thScreenSourcesServer.js',
                    node_env: 'production'
                }
            }
        },
// ---------------------------------------------





// ---------------------------------------------
//                                 develop tasks
// ---------------------------------------------
        watch: {
            express: {
                files:  [ 'build/js/The6thScreenSourcesServer.js' ],
                tasks:  [ 'express:build' ],
                options: {
                    spawn: false
                }
            },

            developServer: {
                files: ['app/scripts/**/*.ts'],
                tasks: ['typescript:build']
            }
        },
// ---------------------------------------------

// ---------------------------------------------
//                                    clean task
// ---------------------------------------------
        clean: {
            build: ['build/'],
            dist: ['dist/']
        }
// ---------------------------------------------
    });

    // register tasks
    grunt.registerTask('default', ['build']);

    grunt.registerTask('build', function () {
        grunt.task.run(['clean:build']);

        grunt.task.run(['typescript:build']);
    });

    grunt.registerTask('dist', function () {
        grunt.task.run(['clean:dist']);

        grunt.task.run(['typescript:dist']);
    });

    grunt.registerTask('develop', ['build', 'express:build', 'watch']);

}