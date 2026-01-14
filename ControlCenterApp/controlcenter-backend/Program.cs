var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers(); 
builder.Services.AddOpenApi();

builder.Services.AddCors(options => {
    options.AddPolicy("AllowAngular", policy => 
            policy
                .WithOrigins(
                    "http://localhost:4200",    
                    "http://localhost:65493",   
                    "https://localhost:4200",
                    "https://localhost:65493"
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
    );
    
    options.AddPolicy("AllowAll", policy =>
            policy
                .AllowAnyOrigin() 
                .AllowAnyHeader()
                .AllowAnyMethod()
    );
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseCors("AllowAll");
}
else
{
    
    app.UseCors("AllowAngular");
}

app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers(); 

app.Run();