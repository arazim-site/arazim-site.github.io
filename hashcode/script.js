// taken from https://stackoverflow.com/a/2901298
const numberWithCommas = (x) => {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function timestampToTime(timestamp) {
	let myDate = new Date(timestamp);
	let submissionTime = (myDate.getHours() < 10 ? "0" : "") + myDate.getHours() + ":" + (myDate.getMinutes() < 10 ? "0" : "") + myDate.getMinutes();
	return submissionTime;
}

function removeFrom(array, element) {
	let index = array.indexOf(element);
	if (index > -1)
		array.splice(index, 1);
}

function addError(error) {
	let newError = `
	<div class='alert alert-danger alert-dismissible fade in'>
		<a href="#" class="close" data-dismiss="alert">&times;</a>
<span class='status'>${error}</span>
	</div>`;
	$('#statuses').append(newError);
}
function clearErrors() {
	$('#statuses').empty();
}

let lastHistory = [];
window.hidden = JSON.parse(localStorage.getItem('hidden')) || [];

class Handler {
	constructor(url) {
		this.ws = new ReconnectingWebSocket(url);
		this.ws.onopen = function(message) {
			console.log('server connected');
			if (groupName.value)
				getHistory(groupName.value);
			$('#server-connected').show();
			$('#server-disconnected').hide();
		}
		this.ws.onclose = function(message) {
			console.log('server disconnected');
			$('#server-connected').hide();
			$('#server-disconnected').show();
		}
		this.ws.onmessage = function(message) {
			let data = JSON.parse(message.data);
			console.log('Got message of type: ' + data['type']);
			switch(data['type']) {
				case 'error':
					addError(data['message']);
					break;
				case 'scoreboard':
					updateScoreboard(data['data']);
					break;
				case 'history':
					updateSubmissionHistory(data['data']);
					break;
				default:
					console.log('Unknown message type:');
					console.log(data['type']);
					break;
			}
		};
	}
	
	send(data) {
		this.ws.send(data);
	}
}

function updateScoreboard(data) {
	console.log('current scoreboard:');
	console.log(data);

	let scores = [];
	
	for (let challenge of ['A', 'B', 'C', 'D', 'E'])
		for (let idPref of ['myScore', 'uploader', 'time'])
				document.getElementById(idPref + challenge).innerText = '-';
	document.getElementById('myTotalScore').innerText = '-';

	Object.keys(data).forEach(function(groupName) {
		let values = data[groupName];
		let a = (values['a'] || {})['score'] || 0;
		let b = (values['b'] || {})['score'] || 0;
		let c = (values['c'] || {})['score'] || 0;
		let d = (values['d'] || {})['score'] || 0;
		let e = (values['e'] || {})['score'] || 0;
		let totalScore = a + b + c + d + e;
		scores.push({group: groupName, totalScore: totalScore, a: a, b: b, c: c, d: d, e: e});

		if (groupName === document.getElementById('groupName').value) {
			for (let challenge of ['A', 'B', 'C', 'D', 'E']) {
				let pack = values[challenge.toLowerCase()] || {'score': 0, 'history': null};
				document.getElementById('myScore' + challenge).innerText = numberWithCommas(pack['score']);
				if (pack['history'] !== null) {
					document.getElementById('uploader' + challenge).innerText = lastHistory[pack['history']]['user'];
					document.getElementById('time' + challenge).innerText = timestampToTime(lastHistory[pack['history']]['timestamp']);
				}
			}
			document.getElementById('myTotalScore').innerText = numberWithCommas(totalScore);
		}
	});

	scores.sort((function(a, b) {
		if (a.totalScore != b.totalScore)
			// Reverse order sort
			return -(a.totalScore - b.totalScore);
		else
			return a.group.localeCompare(b.group);
	}));

	window.scoreboardTable.clear().draw(false);

	let lastScore = null;
	let lastPlace = 0;
	
	let myPlace = '-';
	
	for (let i = 0; i < scores.length; i++) {
		let group = scores[i].group;
		let score = numberWithCommas(scores[i].totalScore);
		let a = numberWithCommas(scores[i].a);
		let b = numberWithCommas(scores[i].b);
		let c = numberWithCommas(scores[i].c);
		let d = numberWithCommas(scores[i].d);
		let e = numberWithCommas(scores[i].e);
		
		let place;
		if (lastScore === null || lastScore > scores[i].totalScore)
			place = lastPlace + 1;
		else
			place = lastPlace;
		
		lastScore = scores[i].totalScore;
		lastPlace = place;
		
		window.scoreboardTable.row.add([place, group, score, a, b, c, d, e]).draw(false);
		if (group === groupName.value) {
			window.scoreboardTable.row(i).node().classList.add('my-score')
			myPlace = place;
		}
	}
	
	document.getElementById('myRank').innerText = myPlace + '/' + lastPlace + ' (' + scores.length + ' groups total)';
}

function updateSubmissionHistory(hist) {
	console.log('current history:');
	console.log(hist);
	lastHistory = hist;

	submissionHistory = document.getElementById('history');
	let table = '<thead> <th>Time</th> <th>Challenge</th> <th>Member</th> <th>Score</th> <th>Output</th> </thead>';

	for (let i = hist.length - 1; i >= 0; i--) {
		let challenge = hist[i].challenge.toUpperCase();
		let user = hist[i].user;
		let score = numberWithCommas(hist[i].score || 0);
		let submissionTime = timestampToTime(hist[i].timestamp);
		let output = hist[i].error;

		table += `<tr>
			<td>${submissionTime}</td>
			<td>${challenge}</td>
			<td>${user}</td>
			<td style='text-align: right;'>${score}</td>
			<td>${output}</td>
			</tr>`;
	}

	submissionHistory.innerHTML = table;
}

function submit(groupName, userName, challenge, submissionChooser) {
	console.log(`submit g:${groupName} u:${userName} challenge:${challenge} file:${submissionChooser}`);
	let submissionFile = submissionChooser.files[0];
	let reader = new FileReader();
	reader.onload = (e) => {
		let submissionMessage = {
			'name': groupName,
			'type': 'submission',
			'user': userName,
			'challenge': challenge,
			'submission': e.target.result
		};
		handler.send(JSON.stringify(submissionMessage));
	};
	reader.readAsText(submissionFile);
}

function submitMulti(groupName, userName, a, b, c, d, e) {
	clearErrors();
	if (!groupName) {
		addError('ERROR: Please enter your group name');
		return false;
	}
	if (!userName) {
		addError('ERROR: Please enter your member name');
		return false;
	}

	let submissions = [a, b, c, d, e];
	let submittedSomething = false;
	for (let i = 0; i < submissions.length; i++) {
		if (submissions[i].files.length) {
			submit(groupName, userName, String.fromCharCode('a'.charCodeAt(0) + i), submissions[i])
			submittedSomething = true;
		}
	}

	if (!submittedSomething)
		addError('ERROR: Please select at least one file to upload');
	return submittedSomething;
}

function getHistory(groupName)
{
	console.log('getting history for ' + groupName);

	let submissionMessage = {
		'name': groupName,
		'type': 'reload',
	};
	handler.send(JSON.stringify(submissionMessage));
}

function updateGroupName() {
	getHistory(groupName.value);
	localStorage.setItem('groupName', groupName.value);
}

function updateMemberName() {
	localStorage.setItem('memberName', memberName.value);
}

function resetFileChoosers()
{
	for (let s of ['subA', 'subB', 'subC', 'subD', 'subE']) {
		$('#' + s).fileinput('clear');
	}
}

var handler = new Handler('wss://f3ca-77-125-1-78.eu.ngrok.io');
console.log('connected to server');

setTimeout(function(event) {
	getHistory(document.getElementById('groupName').value);
}, 1000);

document.addEventListener('DOMContentLoaded', function(event) {
	function getRandomInt(max) {
		return Math.floor(Math.random() * Math.floor(max));
	}
	let names = ['Andrey', 'Yoav', 'Lior'];
	let shuffled = [];

	while (names.length) {
		let i = getRandomInt(names.length);
		shuffled.push(names[i]);
		names.splice(i, 1);
	}
	document.getElementById('credits').innerText = `Made by ${shuffled[0]}, ${shuffled[1]} and ${shuffled[2]}.`
	
	window.scoreboardTable = $('#scoreboard').DataTable({
		'columnDefs': [
			{ className: 'text-right', 'targets': [2, 3, 4, 5, 6, 7] }
		]
	});
	
	$("#groupName").keyup(function(event) {
		updateGroupName();
	});
	
	$('#memberName').keyup(function(event) {
		updateMemberName();
	});
	
	
	// taken from https://stackoverflow.com/a/30416565
	for (let s of window.hidden) {
		$('#' + s).collapse('hide'); // Or whatever API you use to un-collapse the div
	}
	
	$('.collapse').on('hidden.bs.collapse', function() {
		window.hidden.push($(this).attr('id'));
		localStorage.setItem('hidden', JSON.stringify(window.hidden));
	}).on('shown.bs.collapse', function() {
		removeFrom(window.hidden, $(this).attr('id'));
		localStorage.setItem('hidden', JSON.stringify(window.hidden));
	});
	
	groupName.value = localStorage.getItem('groupName');
	memberName.value = localStorage.getItem('memberName');
	
	$('.btn').mouseup(function() {
		$(this).blur();
	});
});
