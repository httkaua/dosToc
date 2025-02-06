### Project Name
Dostoc

### Developer
Kauã Hamilton

### Current goal
Manage real states and customers easily

### Languages
Javascript, HTML, CSS

### Template Engine
Handlebars

### Database
MongoDB

### Deadline to BETA version
04/02/2024

## CURRENT STEP:
Create delete for collections and create "bedrooms" key for realStates collection.
Show the image in the realStates page (table)

## BUGS

## UNEXPECTED BEHAVIORS
- Record page are showing all records (company independent) for all user levels;
- User company in Users collection are storing the name, not the company ID;

### Future ideas
- Simplify the collections (leads: actual city can be just a string with the address), (users: managers can be just a number);
- Smart filter for properties or leads;
- Improve the records, creating a dedicated helper, with json file as a method;
- Future leads (set a date to return contact with the lead);
- Create schedule tasks for agents and supervisors;
- Format all date infos to TimeZone API (without system information);
- Method of creating multiple properties, from a condominium, that can be separated by value or other properties;
- Automatic messages for leads based on some classification (income, neighborhood, others);
- Export and import from Excel;
- Send to email the new user password;
- Create undo button in records, to easily undo other users actions;
