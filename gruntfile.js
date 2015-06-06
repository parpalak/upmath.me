module.exports = function(grunt) {

	grunt.initConfig({
		concat: {
			main: {
				src: [
					'bower_components/autosize/dist/autosize.js',
					'bower_components/Stickyfill/dist/stickyfill.min.js',
					'bower_components/social-likes/src/social-likes.js',
					'www/js/init_editor.js'
				],
				dest: 'www/js/scripts.js'
			}
		},
		uglify: {
			main: {
				files: {
					'www/js/scripts.min.js': '<%= concat.main.dest %>'
				}
			}
		},
		copy: {
			main: {
				files: [
					// includes files within path
					{
						expand: true,
						src: ['bower_components/jquery/dist/jquery.min.js'],
						dest: 'www/js/',
						filter: 'isFile',
						flatten: true
					}
				]
			}
		},
		cssmin: {
			target: {
				src: [
					'www/css/style.css',
					'bower_components/social-likes/social-likes_flat.css'
				],
				dest: 'www/css/style.min.css'
			}
		},
		fingerprint: {
			assets: {
				src: [
					'www/js/*.js',
					'www/css/*.css'
				],
				filename: 'fingerprint.php',
				template: "<?php define('FINGERPRINT', '<%= fingerprint %>'); ?>"
			}
		},
		shell: {
			gzipJS: {
				command: 'gzip -cn6 www/js/scripts.min.js > www/js/scripts.min.js.gz'
			},
			gzipJS2: {
				command: 'gzip -cn6 www/js/jquery.min.js > www/js/jquery.min.js.gz'
			},
			gzipCSS: {
				command: 'gzip -cn6 www/css/style.min.css > www/css/style.min.css.gz'
			},
			gzipPublic: {
				command: 'gzip -cn6 www/latex.js > www/latex.js.gz'
			}
		},
		replace: {
			example: {
				src: ['src/latex.js'],
				dest: 'www/latex.js',
				replacements: [{
					from: 'tex.s2cms.ru',
					to: __dirname.split('/').pop()
				}]
			}
		},
		"file-creator": {
			"basic": {
				"host.php": function(fs, fd, done) {
					fs.writeSync(fd, "<?php define('TEX_HOST', '" + __dirname.split('/').pop() + "'); ?>");
					done();
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-fingerprint');
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-text-replace');
	grunt.loadNpmTasks('grunt-file-creator');

	grunt.registerTask('default', [
		'concat',
		'uglify',
		'copy',
		'cssmin',
		'replace',
		'shell',
		'fingerprint',
		'file-creator'
	]);
};
