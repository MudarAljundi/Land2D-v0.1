module.exports = function(grunt) {

    // configure the tasks
    grunt.initConfig({

        imagemin: {
            dynamic: {
                files: [{
                    expand: true,
                    cwd: 'assets/',
                    src: ['**/*.{png,jpg,gif}'],
                    dest: 'assets/build/'
                }]
            }
        },
        concat: {
            dist: {
                src: ["libs/*.js",
                "js/Polyfill.js", "js/Land2D.js",
                "js/Actor.js", "js/Finder.js", "js/Events.js", "js/AssetManager.js", "js/Keyboard.js", "js/GameState.js"
                ],

                dest: 'js/build/project.js'
            }
        },
        uglify: {
            build: {
                src: 'js/build/project.js',
                dest: 'js/build/project.min.js'
            }
        }
    });

    // load the tasks
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['imagemin' ,'concat', 'uglify']);
    // define the tasks
};