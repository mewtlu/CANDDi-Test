// Sample grunt-jekyll grunt.js file
// https://github.com/dannygarcia/grunt-jekyll

/*global module:false*/
module.exports = function(grunt) {

    var fs          = require('fs-extra'),
        yaml        = require('js-yaml'),
        strEnvironment = grunt.option('environment'),
        Finder      = require('fs-finder');

    grunt.loadNpmTasks('grunt-jekyll');

    // Project configuration.
    grunt.initConfig({
        bower_concat: {
            libs: {
                dest: 'src/_static/js/libs/bower-libs.js',
                bowerOptions: {
                    relative: false
                }
            }
        },
        clean : {
            before : ['./_site', './src/_temp', './src/static'],
            after  : ['./src/_temp']
        },
        concat: {
            dist: {
                src: [
                    'src/_static/js/libs/jquery-1.11.1.js',
                    'src/_static/js/libs/bootstrap.js',
                    'src/_static/js/libs/plugins.js',
                    'src/_static/js/libs/main.js',
                    'src/_static/js/libs/download.js',
                    'src/_static/js/libs/auth0.min.js',
                    'src/_static/js/libs/bower-libs.js',
                    'src/_temp/js/externalmain.js'
                ],//note _temp for external main
                dest: 'src/_temp/js/optimized.js'
            }
        },
        copy : {
            all : {
                files : [
                    //copy files no matter what environment
                    {
                        expand: true,
                        cwd: 'src/_static/',
                        src: [
                            '**',
                            '!css/bootstrap.css',
                            '!css/main.css',
                            '!css/plugins.css',
                            '!css/font-awesome.css',
                            '!css/canddiWebsite.css',
                            '!js/optimized.js'
                        ],
                        dest: 'src/static/'
                    }
                ]
            },
            devImages: {
                files : [
                    {
                        expand: true,
                        cwd:  'src/_rawStatic/_blogImages/',
                        src:  ['**'],
                        dest: '_site/images/blog'
                    },
                    {
                        expand: true,
                        cwd:  'src/_rawStatic/_resourcesImages/',
                        src:  ['**'],
                        dest: '_site/images/resources'
                    },
                    {
                        expand: true,
                        cwd:  'src/_rawStatic/img/',
                        src:  ['**'],
                        dest: '_site/static/img/'
                    },
                    {
                        expand: true,
                        cwd:  'src/_rawStatic/images/',
                        src:  ['**'],
                        dest: '_site/images/'
                    }
                ]
            },
            dev : {},
            devcloud : {},
            prodcloud : {}
        },
        csslint: {
            strict: {
                options: {
                    import: 2
                },
                src: ['./src/static/css/canddiWebsite.css']
            },
            lax: {
                options: {
                    import: false
                },
                src: ['./src/static/css/canddiWebsite.css']
            }
        },
        cssmin: {
            combine: {
                options : {
                    banner : '/* CANDDi minified css */',
                    keepSpecialComments : 0
                },
                files: {
                    './src/_temp/css/canddi.min.css':
                    [
                        './src/_static/css/bootstrap.css',
                        './src/_static/css/bootstrap-ie7.css',
                        './src/_static/css/font-awesome.css',
                        './src/_static/css/main.css',
                        './src/_static/css/*.css',
                        './src/_static/css/new-home-main.css',
                        './src/_static/css/chosen.css'
                    ]
                }
            }
        },
        purgecss: {
          dist: {
            options: {
              content: ['./src/**/*.html', './src/**/*.js'],
              whitelistPatterns: [
                /__content__image/,
                /spritesheet__400/,
                /__icon/,
                /hero__/,
                /chosen-/,
                /loading__spinner/
              ],
              rejected: true
            },
            files: {
                './src/_temp/css/canddi.min.css': ['./src/_temp/css/canddi.min.css']
            }
          }
        },
        htmlmin: {
            prodcloud: {
                options: {
                    removeComments: true,
                    removeEmptyAttributes : true,
                    collapseWhitespace: true
                },
                files:[
                        {expand: true, cwd: '_site/', src: ['**/*.html', '*.html', "!static/docs/**"], dest: '_site/'}
                ]
            }
        },
        jekyll: {
            dev: {
                options : {
                    config : 'src/_data/config-dev.yml',
                    drafts : true
                }
            },
            devNoPosts: {
                options : {
                    config : 'src/_data/config-devNoPosts.yml',
                    drafts : true
                }
            },
            watches : {
                options : {
                    drafts : true,
                    watch : true
                }
            },
            prodcloud: {
                options : {
                    config : 'src/_data/config-prodcloud.yml'
                }
            },
            devcloud: {
                options: {
                    config: 'src/_data/config-devcloud.yml'
                }
            }
        },
        jshint : {
            files : {
                src : ['_temp/js/externalmain.js']
            }
        },
        mkdir: {
            site: {
                options: {
                    create: ['./_site']
                }
            }
        },
        md5: {
            compile: {
                files: {
                    'src/static/css/': 'src/_temp/css/canddi.min.css',
                    'src/static/js/' : 'src/_temp/js/optimized.js'
                },
                options: {
                    encoding: null,
                    keepBasename: false,
                    keepExtension: true,
                    after: function (filesChanged, options) {
                        // Called once for all files are processed by the md5 task.

                        // fileChange is in following format:
                        //
                        // {
                        //   newPath: '...',
                        //   oldPath: '...',
                        //   content: '...'
                        // }

                        var objOut = {},
                            strOut = 'src/_data/assets.yml';

                        //we want to reformat our files into an object of { old_key : 'new/path'}
                        filesChanged.forEach(function (objFile) {
                            //replace /s with _s and .s with - and remove the _temp off the front
                            var strName = objFile.oldPath
                                .replace(/\./g, '-')
                                .replace(/\//g, '_')
                                .replace("_temp_", "");
                            objOut[strName] = objFile.newPath.replace("src", "");;
                        });

                        //then write back to a yaml file
                        fs.writeFile(strOut, yaml.dump(objOut), function (err) {
                            if (err) throw err;
                            console.log('Saved assets file to ' + strOut);
                        });
                    }
                }
            }
        },
        smushit: {
            blog: {
                src: [
                    'src/_rawStatic/blogImages'
                ],
                dest: '_site/images/blog'
            },
            img: {
                src: [
                    'src/_rawStatic/img'
                ],
                dest: '_site/static/img/'
            },
            images: {
                src: [
                    'src/_rawStatic/images'
                ],
                dest: '_site/images/'
            }
        },
        'string-replace': {
            sitemap: {
                files: {
                    '_site/sitemap.xml': '_site/sitemap.xml'
                },
                options: {
                    replacements: [{
                        pattern: /<url>\s<loc>(https?:\/\/)?(www.)?canddi.(local|com)\/blog\/page[0-9]+\/<\/loc>\s<\/url>\s/g,
                        replacement: ''
                    }]
                }
            },
            dev: {
                files: {
                    './src/_temp/js/externalmain.js': 'src/_static/js/externalmain.js',
                },
                options: {
                    replacements: [{
                        pattern: /%%site.urlAuth%%/g,
                        replacement: 'http://auth.canddi.local'
                    }]
                }
            },
            devcloud: {
                files: {
                    'src/_temp/js/externalmain.js': 'src/_static/js/externalmain.js'
                },
                options: {
                    replacements: [{
                        pattern: /%%site.urlAuth%%/g,
                        replacement: 'https://auth.canddi.com'
                    }]
                }
            },
            prodcloud: {
                files: {
                    'src/_temp/js/externalmain.js': 'src/_static/js/externalmain.js'
                },
                options: {
                    replacements: [{
                        pattern: /%%site.urlAuth%%/g,
                        replacement: 'https://auth.canddi.com'
                    }]
                }
            }
        },
        aws: grunt.file.readJSON('_grunt-aws.json'),
        's3-sync': {
            canddi: {
                options: {
                    key: '<%= aws.key %>',
                    secret: '<%= aws.secret %>',
                    bucket: 'www.canddi.com',
                    region: 'eu-west-1',
                    maxOperations: 20,
                    concurrency : 1,
                    headers: {
                        "Cache-Control"     : "public, max-age=3600",
                        "Server"            : "canddi",
                        "X-Xss-Protection"  : '1; mode=block',
                        "X-Content-Type-Options": 'nosniff',
                        "X-Frame-Options"   : "SAMEORIGIN",
                        "Strict-Transport-Security":"max-age=31536000; includeSubdomains"
                    }
                },
                files: [
                    {
                        root: '_site/',
                        src: ['_site/**/*', '!_site/static/**/*'],
                        dest: '/'
                    },
                    {
                        root: '_site/',
                        src: '_site/static/**',
                        dest: '/'
                    }
                ]
            },
            canddiNoExtension: {
                options: {
                    key: '<%= aws.key %>',
                    secret: '<%= aws.secret %>',
                    bucket: 'www.canddi.com',
                    region: 'eu-west-1',
                    maxOperations: 20,
                    concurrency : 1,
                    headers: {
                        "Cache-Control" : "public, max-age=3600",
                        "Content-Type"  : "text/html",
                        "Server"            : "canddi",
                        "X-Xss-Protection"  : '"1; mode=block" always',
                        "X-Content-Type-Options": 'nosniff',
                        "X-Frame-Options"   : "SAMEORIGIN",
                        "Strict-Transport-Security":"max-age=31536000; includeSubdomains"
                    }
                },
                files: [
                    {
                        root: '_noextensions/1/',
                        src: '_noextensions/1/**',
                        dest: '/'
                    },
                    {
                        root: '_noextensions/2/',
                        src: '_noextensions/2/**',
                        dest: '/'
                    },
                    {
                        root: '_noextensions/3/',
                        src: '_noextensions/3/**',
                        dest: '/'
                    }
                ]
            },
        },
        uglify: {
            dev: {
                options: {
                    compress: false,
                    preserveComments: true,
                    mangle: false
                },
                files: [{
                    expand: true,
                    cwd: 'src/_temp/js/',
                    src: 'optimized.js',
                    dest: 'src/static/js'
                }]
            },
            devcloud: {
                options: {
                    compress: true,
                    preserveComments: false,
                    mangle: false
                },
                files: {
                    'src/_temp/js/optimized.js': 'src/_temp/js/optimized.js'
                }
            },
            prodcloud: {
                options: {
                    compress: true,
                    preserveComments : false,
                    mangle : false
                },
                files: {
                    'src/_temp/js/optimized.js' : 'src/_temp/js/optimized.js'
                }
            }
        },
        "update_submodules": {
            default : {
                options : {}
            }
        }
    });
    // plugin tasks
    require('matchdep').filterDev(['grunt-*']).forEach(grunt.loadNpmTasks);

    //register tasks - these are what get called from command line
    //TODO add in css linting - atm there are far too many errors to want to fix
    grunt.registerTask('minCSS',    ['cssmin:combine', 'string-replace:prod', 'jshint', 'concat', 'uglify:dev', 'md5', 'copy:all', 'clean:after']);
    grunt.registerTask('smushIMG',  ['smushit:blog', 'smushit:img', 'smushit:images']);


    //This custom task solves the s3 problem of links like /products?t=t omitting trailing slash having their query strings removed
    //TODO: Major cleanup of this shit code
    //(But it works at least)
    grunt.registerTask('copyFilesAfterFolders', "Copys index.html files in folders to new files named after the folder w/o extension",
    function() {
      //Create the directory _noextensions
      //But first delete it if it exists to get rid of previously generated files
      fs.removeSync('_noextensions');
      fs.mkdirsSync('_noextensions');
      //Look in _site for all index.html files and push to an array...
      var paths = Finder.from("_site").find(),
      arrFilesToCopy = [];
      for (var x in paths) {
        if (paths[x].includes("index.html")) {
          arrFilesToCopy.push(paths[x]);
        }
      }
      //...thats going to be processed now
      //this code is terrible and bad but in a nutshell it builds the path fs will then copy the file to
      for (var x in arrFilesToCopy) {
        var arrPathValues = arrFilesToCopy[x].split("/"),
        strPathToCopyTo = arrFilesToCopy[x].split("/_site/");
        strPathToCopyTo = strPathToCopyTo[1].split("index.html");
        newFilename = arrPathValues[arrPathValues.length - 2];
        newPath = strPathToCopyTo + newFilename;
        newPath = newPath.replace(",", "");
        intLastSlash = newPath.lastIndexOf("/");
        newPath = newPath.substring(0, intLastSlash);
        if (newPath === ""){
          continue;
        }
        //we cant have file called product and directory called product in the same directory
        //so this is a terrible BAD solution that just drops them in a different directory from each other
        try {
          fs.copySync(arrFilesToCopy[x], "_noextensions/1/" + newPath);
        }
        catch (e) {
          try {
            fs.copySync(arrFilesToCopy[x], "_noextensions/2/" + newPath);
          }
          catch (e) {
            fs.copySync(arrFilesToCopy[x], "_noextensions/3/" + newPath);
          }
        }
      }

    });
    if ("devcloud" === strEnvironment) {
        //This includes htmlmin
        arrBuildTasks = [
            'clean:before',
            'update_submodules',
            'mkdir:site',
            'cssmin:combine',
            'purgecss',
            'string-replace:devcloud',
            'jshint',
            'bower_concat',
            'concat',
            'uglify:devcloud',
            'md5',
            'copy:all',
            'jekyll:devcloud',
            'string-replace:sitemap',
            'htmlmin',
            'copy:devImages',
            'clean:after'
        ];
    } else if ("prodcloud" === strEnvironment) {
        //This includes htmlmin
        arrBuildTasks = [
            'clean:before',
            'update_submodules',
            'mkdir:site',
            'cssmin:combine',
            'purgecss',
            'string-replace:prodcloud',
            'jshint',
            'bower_concat',
            'concat',
            'uglify:prodcloud',
            'md5',
            'copy:all',
            'jekyll:prodcloud',
            'string-replace:sitemap',
            'htmlmin',
            'copy:devImages',
            'clean:after'
        ];
    } else {
        arrBuildTasks = [
            'clean:before',
            'update_submodules',
            'mkdir:site',
            'cssmin:combine',
            'purgecss',
            'build:javascript:dev',
            'copy:all',
            'jekyll:dev',
            'string-replace:sitemap',
            'copy:devImages',
            'clean:after'
        ];
    }
    grunt.registerTask(
        'buildLive',
        [
            'clean:before',
            'update_submodules',
            'mkdir:site',
            'cssmin:combine',
            'purgecss',
            'string-replace:prodcloud',
            'jshint',
            'bower_concat',
            'concat',
            'uglify:prodcloud',
            'md5',
            'copy:all',
            'jekyll:prodcloud',
            'string-replace:sitemap',
            'htmlmin',
            'copy:devImages',
            'clean:after'
        ]
    );
    grunt.registerTask(
        'buildDev',
        [
            'clean:before',
            'update_submodules',
            'mkdir:site',
            'cssmin:combine',
            'purgecss',
            'build:javascript:dev',
            'copy:all',
            'jekyll:dev',
            'string-replace:sitemap',
            'copy:devImages',
            'clean:after'
        ]
    );
    grunt.registerTask(
        'buildDevNoPosts',
        [
            'clean:before',
            'update_submodules',
            'mkdir:site',
            'cssmin:combine',
            'purgecss',
            'build:javascript:dev',
            'copy:all',
            'jekyll:devNoPosts',
            'string-replace:sitemap',
            'copy:devImages',
            'clean:after'
        ]
    );
    grunt.registerTask(
        'build:javascript:dev',
        [
            'string-replace:dev',
            'bower_concat',
            'concat',
            'uglify:dev',
            'md5'
        ]
    );
    grunt.registerTask('deploy',    ['buildLive',  'copyFilesAfterFolders',  's3-sync:canddi',    's3-sync:canddiNoExtension']);
    grunt.registerTask('default',   'buildDev');
    grunt.registerTask('buildDevWatch', ['buildDev', 'jekyll:watches']);
    grunt.registerTask('build', arrBuildTasks);
};
