import * as d3 from 'd3';
import * as dataapi from './dataapi';
import * as u from './util';
import './css/suppview.scss';
import * as obec from './obec';


const color = d3.scaleOrdinal(d3.schemeCategory20 );
let detailFrozen = false;

export function remove(){
	d3.selectAll('div.suppview').remove();
	closeGridDetail();
}

export async function draw(otag, year, ico){
	let orgRec = await dataapi.getOrgRec(otag),
		orgId = orgRec && orgRec['OrganizaciaId'],
		viewData = await dataapi.getFaDodForSupp(orgId, year, ico);
	if(viewData){
		let data = viewData.data,
			totalSum = viewData.sum; 

		//basic html structure
		let svDiv = u.selectRoot('div','suppview')
		//HEADER
		let headerDiv = svDiv.selectAll('div.viewtitle');
		headerDiv = headerDiv.empty() ? svDiv.append('div').attr('class','viewtitle') : headerDiv;
		headerDiv.text((data && data[0] && data[0]["DodavatelNazov"] || "??")+ " - Year: " + year + " - Total: "+ u.curr(totalSum));
		dataapi.getYears(orgId).then(function(years){
			if(years){
				for(let i=0;i<years.length;i++){
					if(years[i].id == year){
						headerDiv.text((data && data[0] && data[0]["DodavatelNazov"] || "??")+ " - Year: " + years[i].rok + " - Total: "+ u.curr(totalSum));
					}
				}
			}
		});

		//charts
		let chartDiv = svDiv.selectAll('div.charts');
		chartDiv = chartDiv.empty() ? svDiv.append('div').attr('class','charts') : chartDiv;

		//GRID
		let gridDiv = chartDiv.selectAll('div.grid');
		gridDiv = gridDiv.empty() ? chartDiv.append('div').attr('class','grid') : gridDiv;

		let grid = gridDiv.selectAll('div.grid1');
		grid = grid.empty() ? gridDiv.append('div').attr('class','grid1') : grid;

		//inner grid
		var innerGrid = grid.selectAll('.innergrid').data([1]);
		innerGrid = innerGrid.enter().append('div').attr('class', 'innergrid').merge(innerGrid);

		//header
		var header = innerGrid.selectAll('.header').data([1]);
		header.select(".sum").text("SumaCelkom");
		header.select(".time").text(u.getKeydate());
		header.select(".subject").text("Predmet");
		header.exit().remove();
		var newHeader = header.enter().append('div').attr('class','header');
		newHeader.append("div").attr("class","no").text("#");
		newHeader.append("div").attr("class","sum").text("SumaCelkom");
		newHeader.append("div").attr("class","date").text(u.getKeydate());
		newHeader.append("div").attr("class","subject").text("Predmet");

		//rows
		var row = innerGrid.selectAll('.row').data(data);
		row.select(".sum").text(function(d,i){return u.curr(d["SumaCelkom"]);});
		row.select(".date").text(u.dfKd);
		row.select(".subject").text(function(d,i){return d["Predmet"];});
		
		row.exit().remove();
		
		var newRow = row.enter().append('div').attr('class','row');
		newRow.append("div").attr("class","no").text(function(d,i){return (i+1)+".";});
		newRow.append("div").attr("class","sum").text(function(d,i){return u.curr(d["SumaCelkom"]);});
		newRow.append("div").attr("class","date").text(u.dfKd);
		newRow.append("div").attr("class","subject").text(function(d,i){return d["Predmet"];});
		newRow
			.on('mouseover', function(d){
				if(!detailFrozen){
					grid.selectAll('.row.selected').classed('selected',false);
					d3.select(this).classed('selected', true);
					openGridDetail(d);
				}
			})
			.on('mouseout', function(){
				if(!detailFrozen){
					grid.selectAll('.row.selected').classed('selected',false);
					closeGridDetail();
				}
			})
			.on('mousemove', function(){
				if(!detailFrozen){
					movegrid();
				}
			})
			.on('click', function(){
				detailFrozen = !detailFrozen;
			});

		//clear just to be sure
		closeGridDetail();
		detailFrozen = false;
		//scroll to newly created grid
		svDiv.node().scrollIntoView();
	}else{
		//no data TODO
		remove();
	}
}



let gridDetail;
let gridDetailHeight = 0;
let gridDetailWidth = 0;
let bodyHeight = 0;
let bodyWidth = 0;

function openGridDetail(data){
	var coo = d3.mouse(d3.select('body').node());
	
	gridDetail = d3.select('.spgriddetail');
	if(gridDetail.empty()){
		gridDetail = d3.select('body').append('div').attr('class','spgriddetail');
	}	

	gridDetail.style("transform", "translate(" + (coo[0]+50) + "px," + coo[1] + "px)");
	//title
	var title = gridDetail.selectAll('.rowtitle').data([1]);
	title.enter().append('div').attr('class', 'rowtitle').attr('colspan',4).merge(title).text('Full API Data');

	//inner grid
	var innerGrid = gridDetail.selectAll('.json').data([1]);
	innerGrid = innerGrid.enter().append('pre').attr('class', 'json').merge(innerGrid);
	innerGrid.text(JSON.stringify(data, null, 2));

	gridDetailHeight = parseInt(gridDetail.style('height'),10);
	gridDetailWidth = parseInt(gridDetail.style('width'),10);
	bodyHeight = parseInt(d3.select('body').style('height'),10);
	bodyWidth = parseInt(d3.select('body').style('width'),10);
}
function closeGridDetail(){
	d3.select('.spgriddetail').remove();
	gridDetail = undefined;
}

function movegrid(){
	var coo = d3.mouse(d3.select('body').node());
	if(gridDetail){
		if(gridDetailHeight+coo[1] > bodyHeight-20){
			coo[1] -= gridDetailHeight+10;
		}
		if(gridDetailWidth+coo[0] > bodyWidth-70 && coo[0]- gridDetailWidth > 50){
			coo[0] -= gridDetailWidth+50;
		}else{
			coo[0] +=50;
		}
		gridDetail.style("transform", "translate(" + (coo[0]) + "px," + coo[1] + "px)");
	}
}