module.exports = function(grunt) {

	// フォルダ名設定
	var config = {
		src: 'src',
		public: 'public'
	};

	// 各プラグインの設定
	grunt.initConfig({

		// フォルダ名設定呼び出し
		config: config,

		compass: {
			dev: {
				options: {
					sassDir: '<%= config.src %>/scss',
					cssDir: '<%= config.public %>/css'
				}
			}
		},

		watch: {
			files: ['<%= config.src %>/**'],
			tasks: ['clean', 'compass', 'copy:main'],
			options: {
				livereload: true
			}
		},

		clean: [
			'<%= config.public %>/*'
		],

		copy: {
			init: {
				files: [
					{
						expand: true,
						cwd: 'bower_components/bootstrap-sass/assets/stylesheets/',
						src: ['**'],
						dest: '<%= config.src %>/scss/'
					}
				]
			},
			main: {
				files: [
					{
						expand: true,
						cwd: '<%= config.src %>/',
						src: ['js/**', 'img/**', 'api/**', 'index.html'],
						dest: '<%= config.public %>/',
						dot: false
					}
				]
			},
		}
	});

	// node modules の呼び出し
	grunt.loadNpmTasks('grunt-contrib-compass');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');

	// タスクを登録
	// 初期設定
	grunt.registerTask('init', [
		'copy:init'
	]);

	// 開発時用
	grunt.registerTask('default', [
		'clean',
		'compass',
		'copy:main',
		'watch'
	]);

	// リリース時用
	grunt.registerTask('build', [
		'clean',
		'compass',
		'copy:main'
	]);
}
