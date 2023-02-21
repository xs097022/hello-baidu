var temp = document.createElement('script');
temp.setAttribute('type', 'text/javascript');
temp.src = chrome.extension.getURL('inject.js');
temp.onload = function() {
    this.parentNode.removeChild(this);
};
document.head.appendChild(temp);
