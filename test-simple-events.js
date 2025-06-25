const path = require('path');

// Test if we can import the events module
async function testEventsModule() {
  try {
    console.log('Testing events module import...');

    // Try to import the events module
    const { EventsModule } = require('./dist/src/events/events.module');
    console.log('✅ EventsModule imported successfully');

    const { EventsController } = require('./dist/src/events/events.controller');
    console.log('✅ EventsController imported successfully');

    const { EventsService } = require('./dist/src/events/events.service');
    console.log('✅ EventsService imported successfully');

    console.log('All events module components imported successfully!');
  } catch (error) {
    console.error('❌ Error importing events module:', error.message);
    console.error('Stack:', error.stack);
  }
}

testEventsModule();
