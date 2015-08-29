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
			},
			page: {
				src: [
					'www/page/src/js/*.js'
				],
				dest: 'www/page/dist/js/scripts.js'
			},
			page_vendors: {
				src: [
					'bower_components/social-likes/src/social-likes.js',
					'bower_components/markdown-it/dist/markdown-it.min.js',
					'bower_components/markdown-it-sub/dist/markdown-it-sub.min.js',
					'bower_components/markdown-it-sup/dist/markdown-it-sup.min.js',
					'bower_components/LDT/lib/TextareaDecorator.js',
					'bower_components/file-saver.js/FileSaver.js'
				],
				dest: 'www/page/dist/js/vendors.js'
			}
		},
		uglify: {
			main: {
				files: {
					'www/js/scripts.min.js': '<%= concat.main.dest %>'
				}
			},
			page: {
				src: ['<%= concat.page.dest %>'],
				dest: 'www/page/dist/js/scripts.min.js'
			},
			page_vendors: {
				src: ['<%= concat.page_vendors.dest %>'],
				dest: 'www/page/dist/js/vendors.min.js'
			}
		},
		copy: {
			main: {
				files: [
					// includes files within path
					{
						expand: true,
						src: [
							'bower_components/jquery/dist/jquery.min.js'
						],
						dest: 'www/js/',
						filter: 'isFile',
						flatten: true
					},
					{
						expand: true,
						src: [
							'bower_components/social-likes/src/social-likes.js',
							'bower_components/file-saver.js/FileSaver.js',
							'bower_components/markdown-it/dist/markdown-it.min.js',
							'bower_components/markdown-it-sub/dist/markdown-it-sub.min.js',
							'bower_components/markdown-it-sup/dist/markdown-it-sup.min.js'
						],
						dest: 'www/page/dist/js/',
						filter: 'isFile',
						flatten: true
					},
					{
						expand: true,
						src: [
							'bower_components/LDT/lib/TextareaDecorator.css'
						],
						dest: 'www/page/dist/css/',
						flatten: true
					},
					{
						expand: true,
						src: [
							'bower_components/LDT/lib/TextareaDecorator.js'
						],
						dest: 'www/page/dist/js/',
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
			},
			page: {
				src: [
					'bower_components/LDT/lib/TextareaDecorator.css',
					'www/page/src/css/social-likes_dark.css',
					'www/page/src/css/editor.css'
				],
				dest: 'www/page/dist/css/style.min.css'
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
			},
			page: {
				src: 'www/page/dist/js/scripts.min.js',
				filename: 'www/page/dist/js/scripts.min.js.md5'
			},
			page_vendors: {
				src: 'www/page/dist/js/vendors.min.js',
				filename: 'www/page/dist/js/vendors.min.js.md5'
			},
			page_css: {
				src: 'www/page/dist/css/style.min.css',
				filename: 'www/page/dist/css/style.min.css.md5'
			}
		},
		shell: {
			gzipJS: {
				command: [
					'gzip -cn6 www/js/scripts.min.js > www/js/scripts.min.js.gz',
					'gzip -cn6 www/js/jquery.min.js > www/js/jquery.min.js.gz',
					'gzip -cn6 www/css/style.min.css > www/css/style.min.css.gz'
				].join(' && ')
			},
			gzip_page: {
				command: [
					'gzip -cn6 <%= cssmin.page.dest %> > <%= cssmin.page.dest %>.gz',
					'gzip -cn6 <%= uglify.page.dest %> > <%= uglify.page.dest %>.gz',
					'gzip -cn6 <%= uglify.page_vendors.dest %> > <%= uglify.page_vendors.dest %>.gz'
				].join(' && ')
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
		},
		watch: {
			scripts: {
				files: ['www/js/*.js'],
				tasks: ['concat', 'uglify', 'fingerprint'],
				options: {
					spawn: false
				}
			},
			src: {
				files: ['src/latex.js'],
				tasks: ['replace'],
				options: {
					spawn: false
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
	grunt.loadNpmTasks('grunt-contrib-watch');

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
