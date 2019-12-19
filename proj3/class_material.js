class Material
{
	constructor(ambient, diffusive, specular, shininess)
	{
		this.ambient = new Vector3(ambient);
		this.diffusive = new Vector3(diffusive);
		this.specular = new Vector3(specular);
		this.shininess = shininess;
	}
}

var __js_materials = 
{
	//	http://devernay.free.fr/cours/opengl/materials.html
	moon	  		: new Material([0.0215,0.1745,0.0215],		[0.07568,0.61424,0.07568],		[0.633,0.727811,0.633],				0.6),
	sun  			: new Material([0.1745,0.01175,0.01175],	[0.61424,0.04136,0.04136],		[0.727811,0.626959,0.626959],		0.6),
	earth  			: new Material([0.24725,0.1995,0.0745],		[0.75164,0.60648,0.22648],		[0.628281,0.555802,0.366065],		0.4),
};


