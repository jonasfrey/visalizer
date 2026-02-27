the current workspace holds a complete template / boilerplate / preset  for a full front and backend application including a GUI. it mostly written in native javascript. it seems like a  webapplication but is not a 'website' or 'webapp' in the classical sense. it simply makes use of the browser to be able to present a nice GUI. it can be extended to any kind of application, for example Utility — small focused tool (calculator, file renamer, converter)
Monitoring tool — GPU stats, system health, network traffic
Dashboard — visual overview of data/metrics
Admin panel — manage a service or system
Developer tool / devtool — debugger, profiler, code generator
Productivity app — notes, task manager, editor
Automation tool — scripting, scheduling, batch processing
Creative tool — 3D modeling, image editing, music production
Communication tool — chat, video, collaboration
Data viewer / explorer — database browser, log viewer, file inspector. 
since client side and server side is mainly programmed in native javascript , all functions that can be shared should be shared. this application already has a perfect example for this by having the data structure models on client side which then are loaded by the server. so all functions that are non sensitive have to be shared.
communication is done by a websocket. http requests should be avoided , instead websocket messages are used. there is also a websocket message function that expects a response. it should be used to replace the 'classical' http fetch. 

if a part of the programm can only be executed by calling a binary this can be done but the master scripts should all be in javascript. is required