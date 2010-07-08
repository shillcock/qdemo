var dmz =
       { object: require("dmz/components/object")
       , objectType: require("dmz/runtime/objectType")
       , http: require("dmz/components/http")
       , time: require("dmz/runtime/time")
       , vector: require("dmz/types/vector")
       , matrix: require("dmz/types/matrix")
       , defs: require("dmz/runtime/definitions")
       , util: require("dmz/types/util")
       }
  , inUpload = false
  , revInt = 0
  , reports = { _id: "data" }
  , publish = false
//  Constants
  , DataFile = "http://localhost:5984/demo/data"
  , ReportType = dmz.objectType.lookup("field-report")
  , YellowState = dmz.defs.lookupState("Yellow")
  , RedState = dmz.defs.lookupState("Red")
//  Functions 
  , getRevInt
  , timer
  ;

getRevInt = function (rev) {

   var result = 0
     ;

   if (rev) { result = parseInt(rev.split("-")[0]); }

   return result;
};


timer = function (time) {

   var keys = Object.keys(reports)
     , out
     ;

   if (publish && !inUpload) {

      out = JSON.stringify(reports);

      inUpload = true;

      dmz.http.upload(self, DataFile, out, function(value, addr, error) {

         var crev
           , data = JSON.parse(value)
           ;

         if (data.ok === true) { self.log.info(value); }
         else { self.log.error(value); }

         if (data.rev) {

            crev = getRevInt(data.rev);

            if (crev > revInt) {

               reports._rev = data.rev;
               revInt = crev;
            }
         }
         else { self.log.error(data.error, data.reason); }

         inUpload = false;
      });

      publish = false;
   }
};


dmz.http.download(self, DataFile, function(value, error) {

   var data
     ;

   if (value) {

      data = JSON.parse(value);

      if (data.error && (data.error === "not_found")) {

         inUpload = true;
         dmz.http.upload(self, DataFile, "{}", function(value, addr, error) {

            var data
              ;

            if (value) {

               data = JSON.parse(value);

               if (data.rev) {

                  reports._rev = data.rev
                  revInt = getRevInt(data.rev);
                  dmz.time.setRepeatingTimer(self, 2, timer);
               }
            }

            inUpload = false;
         });
      }
      else if (data._rev) {

         reports._rev = data._rev
         revInt = getRevInt(data._rev);
         dmz.time.setRepeatingTimer(self, 2, timer);
      }
   }
});


self.shutdown = function () {

  // Reset the text overlays to their original values.
};


dmz.object.create.observe(self, function (handle, type) {

   var obj
     ;

   if (type.isOfType(ReportType)) {

      obj = {};

      obj.position = dmz.object.position(handle);
      obj.text = dmz.object.text(handle, "field-report-text");

      reports[handle] = obj;
      publish = true;
   }
});


dmz.object.destroy.observe(self, function (handle) {

   var obj = reports[handle]
     ;

   if (obj) { delete reports[handle]; publish = true; }
});


dmz.object.position.observe(self, function (handle, attr, value) {

   var obj = reports[handle]
     ;

   if (obj) { obj.position = value; publish = true; }
});


dmz.object.state.observe(self, function (handle, attr, value) {

   var obj = reports[handle]
     ;

   if (obj && value) {

      if (value.and(YellowState).bool()) { obj.state = "y"; }
      else if (value.and(RedState).bool()) { obj.state = "r"; }
      else { obj.state = "b"; }

      publish = true;
   }
});


dmz.object.text.observe(self, "field-report-text", function (handle, attr, value) {

   var obj = reports[handle]
     ;

   if (obj) { obj.text = value; publish = true; }
   else { self.log.error("Got text:", value, "for unmapped object:", handle); }
});

