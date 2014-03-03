var path = require('path'),
	fs = require('fs'),
	moment = require('moment'),
	jade = require('jade'),
	markdown = require('markdown-js').markdown,
	pinyin = require('pinyin'),
	util = require('../util.js'),
	common = require('../common.js'),
	tooSolo = global.tooSolo,
	tmplPath = tooSolo.config.skinPath,
	categoriesPath = tooSolo.config.distPath + '/categories';



var buildCategories = function(){

    util.rmdirSyncRecursive(categoriesPath,function(){});
	util.mkdirSyncRecursive(categoriesPath);

	var categoriesTmpl = fs.readFileSync(tmplPath + '/html/category.jade','utf-8'),
		categoriesCompileFunc = jade.compile(categoriesTmpl,{filename:tmplPath + '/html/category.jade',pretty:true}),
		compileLocals = {},
		blogList,
		pageCount,
		categoriesBlogList = {};

	compileLocals.basePath = '..';
	compileLocals.blogName = tooSolo.config.blogName;
	compileLocals.pageTitle = compileLocals.blogName;
	compileLocals.blogSubTitle = tooSolo.config.blogSubTitle;
	compileLocals.blogKeywords = tooSolo.config.blogKeywords;
	compileLocals.blogDescription = tooSolo.config.blogDescription;
	compileLocals.pages = tooSolo.blog.pages;
	compileLocals.category = tooSolo.blog.category;

	/*tooSolo.blog.blogs.forEach(function(blogItem){

		if(!blogItem.category){
			blogItem.category = '未分类';
		}
		if(!categoriesBlogList[blogItem.category]){
			categoriesBlogList[blogItem.category] = [];
		}

		categoriesBlogList[blogItem.category].push(blogItem);

	});*/

	for(var categoryName in tooSolo.blog.category){

		var categoryItem = tooSolo.blog.category[categoryName];

		pageCount = Math.ceil(categoryItem.blogList.length / 5);
		compileLocals.pageCount = pageCount;

		var blogIdList = categoryItem.blogList.slice().map(function(blogItem){
			return blogItem.id;
		});

		blogList = common.getBlogsByIds(blogIdList);

		blogList.sort(function(blog1,blog2){

			var date1 = +blog1.date,
				date2 = +blog2.date;

			return date1<date2 ? 1:-1;

		});

		compileLocals.category[categoryName].url = '/categories/' + 'category_' + pinyin(categoryName,true,'-') + '.html';

		for(var i=0;i < pageCount;i++){
			var fileName = 'category_' + pinyin(categoryName,true,'-') + (i?('_page'+(i+1)):'') + '.html';
			console.log('        ' + fileName);
			compileLocals.blogList = blogList.slice().splice(5*i,5);
			_buildCategoriesFile(fileName,categoriesCompileFunc,compileLocals);
		}


	}
	// console.log(compileLocals.category);

}

function _buildCategoriesFile(fileName,categoriesCompileFunc,compileLocals){
	compileLocals.blogList.forEach(function(blogItem){
		blogItem.summary = markdown(blogItem.summary);
		blogItem.pubDate = moment(blogItem.date).format('YYYY-MM-DD')
	});
	fs.writeFileSync(categoriesPath + '/' + fileName,categoriesCompileFunc(compileLocals));

}

module.exports = function(callback){

	console.log('\n    构建分类页……');
	buildCategories();
	callback();
}
