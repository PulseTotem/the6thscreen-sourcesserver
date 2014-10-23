module.exports = function (grunt) {
    'use strict';

    // load extern tasks
    grunt.loadNpmTasks('grunt-express-server');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-symlink');

    // tasks
    grunt.initConfig({

        coreReposConfig : grunt.file.readJSON('core-repos-config.json'),

// ---------------------------------------------
//                               configure tasks
// ---------------------------------------------
        symlink: {
            // Enable overwrite to delete symlinks before recreating them
            options: {
                overwrite: false
            },
            // The "build/target.txt" symlink will be created and linked to
            // "source/target.txt". It should appear like this in a file listing:
            // build/target.txt -> ../source/target.txt

            coreBackend: {
                src: '<%= coreReposConfig.coreBackendRepoPath %>',
                dest: 't6s-core/core-backend'
            }
        },
// ---------------------------------------------

// ---------------------------------------------
//                          build and dist tasks
// ---------------------------------------------
        typescript: {
            build: {
                src: [
                    'scripts/The6thScreenSourcesServer.ts'
                ],
                dest: 'build/js/The6thScreenSourcesServer.js',
                options: {
                    module: 'commonjs',
                    basePath: 'scripts'
                }
            },
            dist: {
                src: [
                    'scripts/The6thScreenSourcesServer.ts'
                ],
                dest: 'dist/js/The6thScreenSourcesServer.js',
                options: {
                    module: 'commonjs',
                    basePath: 'scripts'
                }
            }
        },

        express: {
            options: {
                port: 5000
            },
            build: {
                options: {
                    script: 'build/js/The6thScreenSourcesServer.js',
                    args: ["loglevel=debug"]
                }
            },
            dist: {
                options: {
                    script: 'dist/js/The6thScreenSourcesServer.js',
                    args: ["loglevel=error"],
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
                files: ['scripts/**/*.ts'],
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

    grunt.registerTask('init', ['symlink']);

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