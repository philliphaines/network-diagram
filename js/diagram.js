Diagram = {
  knownPorts: [
    {port: -1, name: "PING"},
    {port: 22, name: "SSH"},
    {port: 25, name: "SMTP"},
    {port: 80, name: "HTTP"},
    {port: 143, name: "IMAP"},
    {port: 443, name: "HTTPS"},
    {port: 3306, name: "MySQL"},
    {port: 8009, name: "AJP"}
  ],

  load: function() {
    if (!Diagram.data) { Diagram.data = {}; }
    if (!Diagram.templates) { Diagram.templates = {}; }

    return $.when(
      Diagram.loadTemplates([
        "instance.html",
        "group.html"
        ]),
      Diagram.loadGroups(),
      Diagram.loadInstances()
    );
  },

  loadGroups: function() {
    return $.when(
      $.getJSON("data/groups.json").done(function(data) {
        Diagram.data.groups = data.SecurityGroups;
      })
    )
  },

  loadInstances: function() {
    return $.when(
      $.getJSON("data/instances.json").done(function(data) {
        // extract just the instance data
        var instances = [];

        _.each(data.Reservations, function(reservation) {
          instances = instances.concat(reservation.Instances);
        })

        Diagram.data.instances = instances;
      })
    )
  },

  loadTemplates: function(templates) {
    return $.when(_.map(templates, function(template) {
      $.get("templates/" + template, function(templateSource) {
        Diagram.templates[template] = Handlebars.compile(templateSource);
      })
    }))
  },

  findInstancesForGroup: function(group) {
    return _.filter(Diagram.data.instances, function(instance) {
      return _.contains((_.pluck(instance.SecurityGroups, 'GroupId')), group.GroupId);
    })
  },

  render: function() {
    Handlebars.registerHelper('portDescribe', function(ipPermission) {
      var port = "";
      if (ipPermission.FromPort == ipPermission.ToPort) {
        port = _.reduce(
          _.filter(Diagram.knownPorts, function(knownPort) {
            return knownPort.port === ipPermission.ToPort;
          }),
          function(a,port) { return a + " (" + port.name + ")"; },
          new String(ipPermission.ToPort));
      } else {
        port = new String(ipPermission.FromPort + "..." + ipPermission.ToPort);
      }

      return port;
    });

    Handlebars.registerHelper('portThreat', function(ipPermission) {
      var ipAddresses = _.pluck(ipPermission.IpRanges, "CidrIp");

      if (ipAddresses.length > 0 && _.filter(ipAddresses,
        function(ipAddress) {
          return (ipAddress).match(/\/32$/) }
        ).length == ipAddresses.length) {
        return "restricted";
      } else if (ipAddresses.length > 0) {
        return "high";
      } else {
        return "low";
      }
    });

    Handlebars.registerHelper('formatIpAddress', function(ipAddress) {
      return (ipAddress).match(/(.*)\/(.*)$/)[1];
    });

    Handlebars.registerHelper('timeAgo', function(isoDateTime) {
      return moment(isoDateTime).fromNow();
    })

    var groupTemplate = Diagram.templates["group.html"];
    _.each(Diagram.data.groups, function(group) {
      group.Instances = Diagram.findInstancesForGroup(group);
      $("#groups").append(groupTemplate(group));
    })

    var instanceTemplate = Diagram.templates["instance.html"];
    _.each(Diagram.data.instances, function(instance) {
      $("#instances").append(instanceTemplate(instance));
    })
  }
};


$(document).ready(function(){
  Diagram.load().done(function(){
    Diagram.render();
  });
})
