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
    grunt.loadNpmTasks('grunt-contrib-yuidoc');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-mocha-istanbul');

    // tasks
    grunt.initConfig({

        coreReposConfig : grunt.file.readJSON('core-repos-config.json'),

// ---------------------------------------------
//                               configure tasks
// ---------------------------------------------
        symlink: {
            // Enable overwrite to delete symlinks before recreating them
            options: {
                overwrite: true
            },
            // The "build/target.txt" symlink will be created and linked to
            // "source/target.txt". It should appear like this in a file listing:
            // build/target.txt -> ../source/target.txt

            coreBackend: {
                src: '<%= coreReposConfig.coreBackendRepoPath %>',
                dest: 't6s-core/core-backend'
            },
            core: {
                src: '<%= coreReposConfig.coreRepoPath %>',
                dest: 't6s-core/core-backend/t6s-core/core'
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
              src: ['t6s-core/core-backend/package.json','package.json'],
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
            },
            test: {
                src: [
                    'tests/**/*.ts'
                ],
                dest: 'build/tests/Test.js'
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
//                                 doc tasks
// ---------------------------------------------
        yuidoc: {
            compile: {
                name: 'The 6th Screen - SourceServer',
                description: 'Backend for The 6th Screen products.',
                version: '0.0.1',
                url: 'http://www.the6thscreen.fr',
                options: {
                    extension: '.ts, .js',
                    paths: ['scripts/'],
                    outdir: 'doc/'
                }
            }
        },
// ---------------------------------------------

// ---------------------------------------------
//                                 test tasks
// ---------------------------------------------
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    colors: true,
                    captureFile: 'build/tests/result.txt'
                },
                src: ['build/tests/Test.js']
            },
            jenkins: {
                options: {
                    reporter: 'mocha-jenkins-reporter',
                    quiet: true,
                    reporterOptions: {
                        "junit_report_name": "Tests",
                        "junit_report_path": "build/tests/report.xml",
                        "junit_report_stack": 1
                    }
                },
                src: ['build/tests/Test.js']
            }
        },

        mocha_istanbul: {
            coverage: {
                src: 'build/tests/', // a folder works nicely
                options: {
                    mask: '*.js',
                    root: 'build/tests/',
                    reportFormats: ['cobertura', 'html'],
                    coverageFolder: 'build/coverage'
                }
            },
        },
// ---------------------------------------------

// ---------------------------------------------
//                                    clean task
// ---------------------------------------------
        clean: {
            package: ['package-bak.json', 'package-tmp.json'],
            build: ['build/'],
            heroku: ['heroku/'],
            dist: ['dist/'],
            doc: ['doc'],
            test: ['build/tests/Test.js']
        }
// ---------------------------------------------
    });

    // register tasks
    grunt.registerTask('default', ['build']);

    grunt.registerTask('init', ['symlink:coreBackend']);

    grunt.registerTask('initJenkins', ['init','symlink:core']);

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

    grunt.registerTask('doc', ['clean:doc', 'yuidoc']);

    grunt.registerTask('coverage', ['test', 'mochaTest:coverage']);
    grunt.registerTask('initTest', function() {
        grunt.task.run(['clean:build']);

        grunt.task.run(['update_json:packageBuild', 'copy:buildPackageBak', 'copy:buildPackageReplace', 'npm-install', 'copy:buildPackageReinit', 'typescript:build', 'typescript:test']);
    });


    grunt.registerTask('coverage', ['initTest', 'mocha_istanbul:coverage']);
    grunt.registerTask('test', ['initTest', 'mochaTest:test']);

    grunt.registerTask('jenkins', ['initTest', 'mochaTest:jenkins', 'mocha_istanbul:coverage', 'clean:package']);

}