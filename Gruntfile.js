module.exports = function (grunt) {
    'use strict';

    // load extern tasks
    grunt.loadNpmTasks('grunt-update-json');
    grunt.loadNpmTasks('grunt-npm-install');
    grunt.loadNpmTasks('grunt-express-server');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-symlink');
    grunt.loadNpmTasks('grunt-contrib-copy');

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

        update_json: {
            packageBuild: {
                src: ['t6s-core/core-backend/package.json', 'package.json'],
                dest: 'package-tmp.json',
                fields: [
                    'name',
                    'version',
                    'dependencies',
                    'devDependencies',
                    'overrides'
                ]
            },
            packageHeroku: {
              src: ['t6s-core/core-backend/package.json','packageHeroku.json'],
              dest: 'heroku/package.json',
              fields: [
                'name',
                'version',
                'dependencies',
                'devDependencies',
                'overrides'
              ]
            }
        },
// ---------------------------------------------

// ---------------------------------------------
//                          build and dist tasks
// ---------------------------------------------
        copy: {
            buildPackageBak: {
                files: 	[{'package-bak.json': 'package.json'}]
            },
            buildPackageReplace: {
                files: 	[{'package.json': 'package-tmp.json'}]
            },
            buildPackageReinit: {
                files: 	[{'package.json': 'package-bak.json'}]
            },

            heroku: {
              files: 	[{expand: true, cwd: 'dist', src: ['**'], dest: 'heroku'}]
            },
            herokuProcfile: {
              files: 	[{expand: true, cwd: '.', src: ['Procfile'], dest: 'heroku'}]
            },
            herokuGitignore: {
              files: 	[{expand: true, cwd: '.', src: ['.gitignore'], dest: 'heroku'}]
            }
        },

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
                files: ['scripts/**/*.ts', 't6s-core/core-backend/scripts/**/*.ts'],
                tasks: ['typescript:build']
            }
        },
// ---------------------------------------------

// ---------------------------------------------
//                                    clean task
// ---------------------------------------------
        clean: {
            package: ['package-bak.json', 'package-tmp.json'],
            build: ['build/'],
            heroku: ['heroku/'],
            dist: ['dist/']
        }
// ---------------------------------------------
    });

    // register tasks
    grunt.registerTask('default', ['build']);

    grunt.registerTask('init', ['symlink']);

    grunt.registerTask('build', function () {
        grunt.task.run(['clean:package', 'clean:build']);

        grunt.task.run(['update_json:packageBuild', 'copy:buildPackageBak', 'copy:buildPackageReplace', 'npm-install', 'copy:buildPackageReinit', 'typescript:build', 'clean:package']);
    });

    grunt.registerTask('dist', function () {
        grunt.task.run(['clean:package', 'clean:dist']);

        grunt.task.run(['update_json:packageBuild', 'copy:buildPackageBak', 'copy:buildPackageReplace', 'npm-install', 'copy:buildPackageReinit', 'typescript:dist', 'clean:package']);
    });

    grunt.registerTask('heroku', function () {
      grunt.task.run(['clean:heroku']);

      grunt.task.run(['dist', 'update_json:packageHeroku', 'copy:heroku', 'copy:herokuProcfile', 'copy:herokuGitignore']);
    });

    grunt.registerTask('develop', ['build', 'express:build', 'watch']);

}