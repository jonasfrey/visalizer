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

if a part of the programm can only be executed by calling a binary this can be done but the master scripts should all be in javascript.

this application eventually will become an application that can analyze images. 

Step by step we will now create the new application 

for starting remove the models o_student, o_course, and o_course_o_student
---
next e need a way to add test data. what would you recommend? i would like to download the following zip to a .gitignored location so and unzip it . it contains many many images. 
http://images.cocodataset.org/zips/val2017.zip

---
the start path of the file browser should be the foler with the testdata
---

---
now we will implement a way to properly scan folders that are on the file system. we will use the file browser for this. 
in the filebrowser page we will have the option recursive (activated by default) and the button 'scan folder' . important things to consider are:
there could be thousands of files that have to be scanned, we need to show the scanning process!
the scanning process should be cancable and stoppable. the user should also be able to remove the scanned folder, for example if they missclicked.  

for the system to be able to store a scan target (a folder basically) we add the follwing models 


let o_model__o_scantarget = f_o_model({
    s_name: 'o_scantarget',
    a_o_property: [
        f_o_model_prop__default_id(s_name_prop_id),
        f_o_property('s_path_absolute', 'string', (s)=>{return s!==''}),
        f_o_property('n_files_recursive', 'number'),
        f_o_property('n_folders_recursive', 'number'),
        f_o_model_prop__default_id(f_s_name_foreign_key__from_o_model(o_model__o_fsnode)),
        f_o_property('b_recursive', 'boolean'),
        f_o_model_prop__timestamp_default(s_name_prop_ts_created),
        f_o_model_prop__timestamp_default(s_name_prop_ts_updated),
    ]
})

all the files and folders inside this folder should be then created as o_fsnode instances. if the option 'recursive' is enabled it should be done recursively. 

if the user browses the file browser all folders that are scan targets should be marked. if a scantarget folder is the current path of the filebrowser, the button to 'scan' should be called 're-scan' 
--- 
before a scan target is created we can quickly get the amount of child files and folders with some linux CLI functions, use the function f_o_scantarget__from_s_path in cli_functions.js for this
---
if a folder in the filebrowser is a scantarget it should be marked and also say how many files and folders it contains and if it is set to recursive or not
---
now that we have the basic information 
---
currently it is not clear which folder the actual target is . instead of having a separate bar with the scanning buttons. the scanning buttons and options should be directly shown next to o_fsnode if it is a folder in the filebrowser
---
'Remove' button on a folder can be misinterpreted as 'delete' folder . we need a better title'
---