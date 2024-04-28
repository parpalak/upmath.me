module.exports = function(grunt) {

	grunt.initConfig({
		concat: {
			main: {
				src: [
					'public_html/src/js/*.js'
				],
				dest: 'public_html/dist/js/scripts.js'
			},
			vendors: {
				src: [
					'node_modules/markdown-it/dist/markdown-it.min.js',
					'node_modules/markdown-it-sub/dist/markdown-it-sub.min.js',
					'node_modules/markdown-it-sup/dist/markdown-it-sup.min.js',
					'node_modules/LDT/lib/TextareaDecorator.js',
					'node_modules/file-saver/dist/FileSaver.min.js',
					'node_modules/draggabilly/dist/draggabilly.pkgd.min.js',
					'public_html/lib/highlight.js/highlight.pack.js'
				],
				dest: 'public_html/dist/js/vendors.js'
			}
		},
		uglify: {
			main: {
				src: ['<%= concat.main.dest %>'],
				dest: 'public_html/dist/js/scripts.min.js'
			},
			vendors: {
				src: ['<%= concat.vendors.dest %>'],
				dest: 'public_html/dist/js/vendors.min.js'
			}
		},
		dataUri: {
			main: {
				src: [
					'public_html/src/css/editor.css'
				],
				dest: "public_html/dist/css/",
				options: {
					target: ['*/i/*.*'],
					maxBytes : 5000,
				}
			}
		},
		cssmin: {
			main: {
				src: [
					'node_modules/LDT/lib/TextareaDecorator.css',
					'public_html/lib/highlight.js/solarized-light.css',
					'<%= dataUri.main.dest %>/editor.css'
				],
				dest: 'public_html/dist/css/style.min.css'
			}
		},
		fingerprint: {
			main: {
				src: 'public_html/dist/js/scripts.min.js',
				filename: 'public_html/dist/js/scripts.min.js.md5'
			},
			vendors: {
				src: 'public_html/dist/js/vendors.min.js',
				filename: 'public_html/dist/js/vendors.min.js.md5'
			},
			css: {
				src: 'public_html/dist/css/style.min.css',
				filename: 'public_html/dist/css/style.min.css.md5'
			},
			link: {
				src: 'public_html/dist/css/style.min.css',
				filename: 'public_html/dist/css/style.min.css.html',
				template: '<link rel="stylesheet" href="/dist/css/style.min.css?<%= fingerprint %>">'
			}
		},
		shell: {
			gzipJS: {
				command: [
					'gzip -cn6 <%= uglify.main.dest %> > <%= uglify.main.dest %>.gz',
					'gzip -cn6 <%= uglify.vendors.dest %> > <%= uglify.vendors.dest %>.gz'
				].join(' && ')
			},
			gzipCSS: {
				command: [
					'gzip -cn6 <%= cssmin.main.dest %> > <%= cssmin.main.dest %>.gz',
				].join(' && ')
			}
		},
		processhtml: {
			error: {
				src: 'src/404.html',
				dest: 'public_html/404.html'
			},
			news: {
				src: 'src/whatsnew.html',
				dest: 'public_html/whatsnew.html'
			},
		},
		watch: {
			scripts: {
				files: ['public_html/src/js/*.js'],
				tasks: ['concat:main', 'uglify:main', 'fingerprint:main', 'shell:gzipJS'],
				options: {
					spawn: false
				}
			},
			styles: {
				files: ['public_html/src/css/*.css'],
				tasks: ['dataUri', 'cssmin', 'fingerprint:css', 'fingerprint:link', 'shell:gzipCSS'],
				options: {
					spawn: false
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-fingerprint');
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-data-uri-advanced');
	grunt.loadNpmTasks('grunt-processhtml');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', [
		'concat',
		'uglify',
		'dataUri',
		'cssmin',
		'shell',
		'fingerprint',
		'processhtml',
	]);
};
